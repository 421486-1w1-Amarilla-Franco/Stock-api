import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, PackageCheck, X, Sparkles, Trash2 } from 'lucide-react';
import {
  useCompras, useSugerenciasCompra, useProveedores, useCrearCompra, useAccionCompra, useGuardarProveedor,
  type ProveedorInput,
} from '../hooks/useTaller';
import { useProductos } from '../hooks/useProductos';
import Drawer from '../components/Drawer';
import ConfirmModal from '../components/ConfirmModal';
import { useApp } from '../lib/app-context';
import { apiError } from '../lib/errors';
import { fmtARS, fmtDateTime } from '../lib/format';
import type { CompraResponse, EstadoCompra, ProveedorResponse } from '../types/api';

interface Linea { productoId: number; cantidad: number; costoUnitario: number }

const ESTADO: Record<EstadoCompra, { label: string; cls: string }> = {
  PENDIENTE: { label: 'Pendiente', cls: 'status-low' },
  RECIBIDA: { label: 'Recibida', cls: 'status-ok' },
  ANULADA: { label: 'Anulada', cls: 'status-inactive' },
};

function CompraDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useApp();
  const { data: proveedores = [] } = useProveedores();
  const { data: productos = [] } = useProductos();
  const { data: sugerencias = [] } = useSugerenciasCompra();
  const crear = useCrearCompra();
  const [proveedorId, setProveedorId] = useState<number | ''>('');
  const [comprobante, setComprobante] = useState('');
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [agregar, setAgregar] = useState('');

  useEffect(() => {
    if (open) { setProveedorId(''); setComprobante(''); setLineas([]); setAgregar(''); }
  }, [open]);

  const activos = productos.filter((p) => p.activo);
  const byId = useMemo(() => new Map(productos.map((p) => [p.id, p])), [productos]);
  const total = lineas.reduce((s, l) => s + l.cantidad * l.costoUnitario, 0);
  const valido = proveedorId !== '' && lineas.length > 0 && lineas.every((l) => l.cantidad > 0 && l.costoUnitario >= 0);

  const addLinea = (productoId: number, cantidad = 1, costo?: number) => {
    setLineas((ls) => ls.some((l) => l.productoId === productoId) ? ls
      : [...ls, { productoId, cantidad, costoUnitario: costo ?? byId.get(productoId)?.precioCosto ?? 0 }]);
  };
  const upd = (i: number, patch: Partial<Linea>) => setLineas((ls) => ls.map((l, j) => j === i ? { ...l, ...patch } : l));

  const save = () => {
    if (!valido || typeof proveedorId !== 'number') return;
    crear.mutate({ proveedorId, comprobante: comprobante.trim() || undefined, detalles: lineas }, {
      onSuccess: (c) => { toast('success', `Orden de compra #${c.id} creada · ${fmtARS(c.total)}`); onClose(); },
      onError: (err) => toast('error', apiError(err, 'No se pudo crear la compra')),
    });
  };

  return (
    <Drawer open={open} onClose={onClose} title="Nueva orden de compra" width={640}
      subtitle="El stock sube cuando marcás la compra como recibida."
      footer={<>
        <span className="drawer-total">Total <strong className="num">{fmtARS(total)}</strong></span>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={save} disabled={!valido || crear.isPending}>Crear orden</button>
      </>}>
      <div className="form">
        <div className="form-row form-row-2">
          <label className="field">
            <span className="field-label">Proveedor <span className="field-req">*</span></span>
            <select className="input select" value={proveedorId} onChange={(e) => setProveedorId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">Elegí un proveedor…</option>
              {proveedores.filter((p) => p.activo).map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
            {proveedores.length === 0 && <span className="field-hint">Primero cargá un proveedor en la pestaña Proveedores.</span>}
          </label>
          <label className="field">
            <span className="field-label">Comprobante</span>
            <input className="input mono" value={comprobante} onChange={(e) => setComprobante(e.target.value)} placeholder="A-0001-00001234" />
          </label>
        </div>

        <div className="form-section">
          <div className="form-section-head">
            <span className="form-section-title">Productos</span>
            {sugerencias.length > 0 && (
              <button type="button" className="link-btn" onClick={() => sugerencias.forEach((s) => addLinea(s.productoId, s.cantidadSugerida, s.costoUnitario))}>
                <Sparkles size={13} aria-hidden="true" /> Cargar {sugerencias.length} para reponer
              </button>
            )}
          </div>
          <select className="input select" value={agregar} aria-label="Agregar producto"
            onChange={(e) => { if (e.target.value) addLinea(Number(e.target.value)); setAgregar(''); }}>
            <option value="">+ Agregar producto…</option>
            {activos.filter((p) => !lineas.some((l) => l.productoId === p.id)).map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}{p.codigo ? ` · ${p.codigo}` : ''} (stock {p.stockActual})</option>
            ))}
          </select>
          {lineas.length > 0 && (
            <div className="compra-lines">
              {lineas.map((l, i) => {
                const p = byId.get(l.productoId);
                return (
                  <div key={l.productoId} className="compra-line">
                    <div className="compra-line-name">
                      <strong>{p?.nombre}</strong>
                      <span className="muted">stock {p?.stockActual} · mín {p?.stockMinimo}</span>
                    </div>
                    <label className="compra-line-field">
                      <span className="sr-only">Cantidad</span>
                      <input className="input" type="number" min="1" value={l.cantidad} onChange={(e) => upd(i, { cantidad: Math.max(1, Number(e.target.value) || 1) })} />
                    </label>
                    <label className="compra-line-field field-control has-prefix">
                      <span className="sr-only">Costo unitario</span>
                      <span className="field-prefix">$</span>
                      <input className="input" type="number" min="0" value={l.costoUnitario} onChange={(e) => upd(i, { costoUnitario: Math.max(0, Number(e.target.value) || 0) })} />
                    </label>
                    <span className="num compra-line-sub">{fmtARS(l.cantidad * l.costoUnitario)}</span>
                    <button type="button" className="icon-btn icon-btn-sm" onClick={() => setLineas((ls) => ls.filter((_, j) => j !== i))} aria-label={`Quitar ${p?.nombre}`}>
                      <X size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}

function ProveedorDrawer({ open, proveedor, onClose }: { open: boolean; proveedor: ProveedorResponse | null; onClose: () => void }) {
  const { toast } = useApp();
  const guardar = useGuardarProveedor();
  const [f, setF] = useState<ProveedorInput>({ nombre: '' });
  useEffect(() => {
    if (open) setF(proveedor ? { nombre: proveedor.nombre, cuit: proveedor.cuit ?? '', telefono: proveedor.telefono ?? '', email: proveedor.email ?? '' }
      : { nombre: '', cuit: '', telefono: '', email: '' });
  }, [open, proveedor]);
  const set = (k: keyof ProveedorInput) => (e: React.ChangeEvent<HTMLInputElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  const save = () => guardar.mutate({ id: proveedor?.id, data: f }, {
    onSuccess: () => { toast('success', 'Proveedor guardado'); onClose(); },
    onError: (err) => toast('error', apiError(err, 'No se pudo guardar el proveedor')),
  });
  return (
    <Drawer open={open} onClose={onClose} title={proveedor ? 'Editar proveedor' : 'Nuevo proveedor'}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={save} disabled={!f.nombre.trim() || guardar.isPending}>Guardar</button>
      </>}>
      <div className="form">
        <label className="field"><span className="field-label">Nombre <span className="field-req">*</span></span>
          <input className="input" value={f.nombre} onChange={set('nombre')} autoFocus /></label>
        <div className="form-row form-row-2">
          <label className="field"><span className="field-label">CUIT</span><input className="input mono" value={f.cuit} onChange={set('cuit')} /></label>
          <label className="field"><span className="field-label">Teléfono</span><input className="input" type="tel" value={f.telefono} onChange={set('telefono')} /></label>
        </div>
        <label className="field"><span className="field-label">Email</span><input className="input" type="email" value={f.email} onChange={set('email')} /></label>
      </div>
    </Drawer>
  );
}

export default function Compras() {
  const { isAdmin, toast } = useApp();
  const [tab, setTab] = useState<'ordenes' | 'proveedores'>('ordenes');
  const { data: compras = [], isLoading } = useCompras();
  const { data: proveedores = [] } = useProveedores();
  const { data: sugerencias = [] } = useSugerenciasCompra();
  const accion = useAccionCompra();
  const [nueva, setNueva] = useState(false);
  const [prov, setProv] = useState<{ open: boolean; p: ProveedorResponse | null }>({ open: false, p: null });
  const [confirm, setConfirm] = useState<{ compra: CompraResponse; accion: 'recibir' | 'anular' } | null>(null);
  const [abierta, setAbierta] = useState<number | null>(null);

  const ejecutar = () => {
    if (!confirm) return;
    const { compra, accion: a } = confirm;
    accion.mutate({ id: compra.id, accion: a }, {
      onSuccess: () => toast('success', a === 'recibir' ? `Compra #${compra.id} recibida · stock actualizado` : `Compra #${compra.id} anulada`),
      onError: (err) => toast('error', apiError(err, 'No se pudo completar la acción')),
    });
    setConfirm(null);
  };

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Compras</h1>
          <p className="page-sub">
            {sugerencias.length > 0
              ? <><strong>{sugerencias.length}</strong> producto{sugerencias.length === 1 ? '' : 's'} en o bajo el mínimo: armá el pedido con un clic.</>
              : 'Todo el stock está por encima del mínimo.'}
          </p>
        </div>
        <div className="page-actions">
          {tab === 'proveedores' && isAdmin && (
            <button className="btn btn-ghost" onClick={() => setProv({ open: true, p: null })}><Plus size={14} aria-hidden="true" /> Proveedor</button>
          )}
          <button className="btn btn-primary" onClick={() => setNueva(true)}><Plus size={14} strokeWidth={2} aria-hidden="true" /> Nueva compra</button>
        </div>
      </div>

      <div className="seg" role="tablist" aria-label="Sección">
        <button role="tab" aria-selected={tab === 'ordenes'} className={`seg-btn${tab === 'ordenes' ? ' is-active' : ''}`} onClick={() => setTab('ordenes')}>
          Órdenes <span className="seg-count">{compras.length}</span>
        </button>
        <button role="tab" aria-selected={tab === 'proveedores'} className={`seg-btn${tab === 'proveedores' ? ' is-active' : ''}`} onClick={() => setTab('proveedores')}>
          Proveedores <span className="seg-count">{proveedores.length}</span>
        </button>
      </div>

      {tab === 'ordenes' ? (
        <div className="card no-pad">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col" style={{ width: 70 }}>N°</th>
                  <th scope="col" style={{ width: 140 }}>Fecha</th>
                  <th scope="col">Proveedor</th>
                  <th scope="col" style={{ width: 90, textAlign: 'right' }}>Ítems</th>
                  <th scope="col" style={{ width: 130, textAlign: 'right' }}>Total</th>
                  <th scope="col" style={{ width: 110 }}>Estado</th>
                  <th scope="col" style={{ width: 220 }}><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {isLoading && <tr><td colSpan={7}><div className="skeleton" style={{ height: 14 }} /></td></tr>}
                {!isLoading && compras.length === 0 && (
                  <tr><td colSpan={7} className="empty-state">
                    <div className="empty-title">Sin compras todavía</div>
                    <div className="empty-sub">Creá una orden y marcala como recibida cuando llegue la mercadería.</div>
                  </td></tr>
                )}
                {compras.map((c) => (
                  <Fragment key={c.id}>
                    <tr className="table-clickable" onClick={() => setAbierta(abierta === c.id ? null : c.id)} aria-expanded={abierta === c.id}>
                      <td className="td-id">#{c.id}</td>
                      <td className="td-muted">{fmtDateTime(c.fecha)}</td>
                      <td>
                        <div className="td-product">
                          <span className="td-product-name">{c.proveedorNombre}</span>
                          {c.comprobante && <span className="td-product-code">{c.comprobante}</span>}
                        </div>
                      </td>
                      <td className="td-num">{c.detalles.reduce((s, d) => s + d.cantidad, 0)}</td>
                      <td className="td-num"><strong>{fmtARS(c.total)}</strong></td>
                      <td><span className={`status-chip ${ESTADO[c.estado].cls}`}>{ESTADO[c.estado].label}</span></td>
                      <td onClick={(e) => e.stopPropagation()}>
                        {c.estado === 'PENDIENTE' && (
                          <div className="row-btns">
                            <button className="btn btn-ghost btn-sm" onClick={() => setConfirm({ compra: c, accion: 'recibir' })}>
                              <PackageCheck size={14} aria-hidden="true" /> Recibir
                            </button>
                            {isAdmin && (
                              <button className="btn btn-ghost btn-sm" onClick={() => setConfirm({ compra: c, accion: 'anular' })} aria-label={`Anular compra #${c.id}`}>
                                <Trash2 size={14} aria-hidden="true" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                    {abierta === c.id && (
                      <tr className="row-detail">
                        <td colSpan={7}>
                          <ul className="detail-list">
                            {c.detalles.map((d) => (
                              <li key={d.productoId}>
                                <Link className="link" to={`/productos/${d.productoId}`}>{d.productoNombre}</Link>
                                <span className="num muted">{d.cantidad} × {fmtARS(d.costoUnitario)}</span>
                                <span className="num">{fmtARS(d.subtotal)}</span>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card no-pad">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Proveedor</th>
                  <th scope="col" style={{ width: 160 }}>CUIT</th>
                  <th scope="col" style={{ width: 160 }}>Teléfono</th>
                  <th scope="col">Email</th>
                </tr>
              </thead>
              <tbody>
                {proveedores.length === 0 && <tr><td colSpan={4} className="card-empty">Sin proveedores cargados.</td></tr>}
                {proveedores.map((p) => (
                  <tr key={p.id} className={isAdmin ? 'table-clickable' : undefined} onClick={() => isAdmin && setProv({ open: true, p })}>
                    <td className="td-product-name">{p.nombre}</td>
                    <td className="mono td-muted">{p.cuit ?? '—'}</td>
                    <td className="td-muted">{p.telefono ?? '—'}</td>
                    <td className="td-muted">{p.email ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CompraDrawer open={nueva} onClose={() => setNueva(false)} />
      <ProveedorDrawer open={prov.open} proveedor={prov.p} onClose={() => setProv({ open: false, p: null })} />
      <ConfirmModal
        open={!!confirm}
        title={confirm?.accion === 'recibir' ? `¿Recibir compra #${confirm.compra.id}?` : `¿Anular compra #${confirm?.compra.id}?`}
        description={confirm?.accion === 'recibir'
          ? 'Suma el stock de cada producto y actualiza su costo al de esta compra. Queda en el historial de movimientos.'
          : 'La orden queda anulada y no mueve stock.'}
        confirmLabel={confirm?.accion === 'recibir' ? 'Recibir mercadería' : 'Anular'}
        danger={confirm?.accion === 'anular'}
        onConfirm={ejecutar}
        onCancel={() => setConfirm(null)}
      />
    </main>
  );
}
