import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Download, Plus, Search, Trash2 } from 'lucide-react';
import { useVentas, useVenta, useEliminarVenta } from '../hooks/useVentas';
import Drawer from '../components/Drawer';
import ConfirmModal from '../components/ConfirmModal';
import Pager from '../components/Pager';
import { fmtARS, fmtDateTime, fmtDateTimeFull } from '../lib/format';
import { exportCSV } from '../lib/export';
import { apiError } from '../lib/errors';
import { useDebounced } from '../lib/useDebounced';
import { useApp } from '../lib/app-context';
import { MEDIOS_PAGO, type EstadoVenta, type MedioPago, type VentaResponse } from '../types/api';

const medioLabel = (m: MedioPago) => MEDIOS_PAGO.find((x) => x.id === m)?.label ?? m;

const EstadoChip = ({ estado }: { estado: EstadoVenta }) => (
  <span className={`estado-chip ${estado === 'ANULADA' ? 'estado-cancel' : 'estado-done'}`}>
    <span className="estado-dot" aria-hidden="true" />
    {estado === 'ANULADA' ? 'Anulada' : 'Completada'}
  </span>
);

function VentaDrawer({ ventaId, onClose }: { ventaId?: number; onClose: () => void }) {
  const { isAdmin, toast } = useApp();
  const { data: venta, isLoading, isError } = useVenta(ventaId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const eliminar = useEliminarVenta();
  const open = !!ventaId;

  const handleAnular = () => {
    if (!venta) return;
    eliminar.mutate(venta.id, {
      onSuccess: () => {
        toast('info', `Venta #${venta.id} anulada · stock devuelto`);
        setConfirmOpen(false);
        onClose();
      },
      onError: (err) => { setConfirmOpen(false); toast('error', apiError(err, 'Error al anular la venta')); },
    });
  };

  const puedeAnular = venta && venta.estado !== 'ANULADA' && isAdmin;

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title={venta ? `Venta #${venta.id}` : `Venta #${ventaId ?? ''}`}
        subtitle={venta ? `${fmtDateTimeFull(venta.fecha)} · ${venta.usuarioNombre}` : undefined}
        width={540}
        footer={
          <>
            {puedeAnular && (
              <button className="btn btn-danger" style={{ marginRight: 'auto' }} onClick={() => setConfirmOpen(true)} disabled={eliminar.isPending}>
                <Trash2 size={14} aria-hidden="true" /> Anular venta
              </button>
            )}
            <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
          </>
        }
      >
        {isLoading && <div className="skeleton" style={{ height: 120 }} />}
        {isError && <div className="hint hint-error">No se encontró la venta #{ventaId}.</div>}
        {venta && (
          <div className="venta-detail">
            <div className="venta-detail-status">
              <EstadoChip estado={venta.estado} />
              <span className="chip chip-ghost">{medioLabel(venta.medioPago)}</span>
              {venta.estado === 'ANULADA' && <span className="venta-detail-hint">Stock devuelto al inventario</span>}
            </div>

            {(venta.clienteNombre || venta.vehiculoPatente) && (
              <div className="venta-detail-obs">
                {venta.clienteId && <Link className="link" to={`/clientes/${venta.clienteId}`}>{venta.clienteNombre}</Link>}
                {venta.vehiculoPatente && (
                  <> · <span className="mono">{venta.vehiculoPatente}</span> {venta.vehiculoDescripcion}
                    {venta.kmVehiculo != null && ` · ${venta.kmVehiculo.toLocaleString('es-AR')} km`}</>
                )}
              </div>
            )}

            {venta.observaciones && <div className="venta-detail-obs">{venta.observaciones}</div>}

            <div>
              <div className="venta-detail-label" style={{ marginBottom: 8 }}>Ítems ({venta.cantidadItems})</div>
              <div className="venta-lines">
                {venta.detalles.map((d) => (
                  <div key={d.id} className="venta-line">
                    <div className="venta-line-main">
                      <Link className="venta-line-name link" to={`/productos/${d.productoId}`}>{d.productoNombre}</Link>
                      <div className="venta-line-meta">
                        {d.productoCodigo && <><span className="mono">{d.productoCodigo}</span><span>·</span></>}
                        <span>{d.cantidad} × {fmtARS(d.precioUnitario)}</span>
                      </div>
                    </div>
                    <div className="venta-line-sub">{fmtARS(d.subtotal)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="venta-detail-totals">
              {venta.manoObra > 0 && (
                <>
                  <div className="venta-total-row"><span>Repuestos</span><span className="num">{fmtARS(venta.total - venta.manoObra)}</span></div>
                  <div className="venta-total-row"><span>Mano de obra</span><span className="num">{fmtARS(venta.manoObra)}</span></div>
                </>
              )}
              <div className="venta-total-row venta-total-main"><span>Total</span><strong className="num">{fmtARS(venta.total)}</strong></div>
              {isAdmin && (
                <div className="venta-total-row muted"><span>Ganancia bruta</span><span className="num">{fmtARS(venta.margen)}</span></div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmModal
        open={confirmOpen}
        title={`Anular venta #${venta?.id ?? ''}`}
        description="La venta queda anulada y el stock vuelve al inventario. Queda registro en el historial."
        confirmLabel="Anular"
        danger
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleAnular}
      />
    </>
  );
}

type FiltroEstado = 'todas' | EstadoVenta;

export default function Ventas() {
  const { openPos } = useApp();
  const [params, setParams] = useSearchParams();
  const ventaId = Number(params.get('venta')) || undefined;
  const [estado, setEstado] = useState<FiltroEstado>('todas');
  const [medio, setMedio] = useState<MedioPago | ''>('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const qd = useDebounced(q.trim(), 300);

  const filtro = { q: qd, estado: estado === 'todas' ? undefined : estado, medioPago: medio || undefined, page };
  const { data, isLoading, isError, refetch } = useVentas(filtro);
  const list = data?.content ?? [];

  const abrir = (v: VentaResponse) => setParams((p) => { p.set('venta', String(v.id)); return p; });
  const cerrar = () => setParams((p) => { p.delete('venta'); return p; });

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Ventas</h1>
          <p className="page-sub">Buscá por número, cliente, patente u observaciones.</p>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-ghost"
            disabled={list.length === 0}
            onClick={() => exportCSV('ventas', list.map((v) => ({
              id: v.id, fecha: fmtDateTime(v.fecha), total: v.total, medioPago: medioLabel(v.medioPago),
              cliente: v.clienteNombre ?? '', patente: v.vehiculoPatente ?? '', items: v.cantidadItems,
              usuario: v.usuarioNombre, estado: v.estado, observaciones: v.observaciones ?? '',
            })), [
              { key: 'id', header: 'N°' }, { key: 'fecha', header: 'Fecha' }, { key: 'total', header: 'Total' },
              { key: 'medioPago', header: 'Medio de pago' }, { key: 'cliente', header: 'Cliente' },
              { key: 'patente', header: 'Patente' }, { key: 'items', header: 'Ítems' },
              { key: 'usuario', header: 'Usuario' }, { key: 'estado', header: 'Estado' },
              { key: 'observaciones', header: 'Observaciones' },
            ])}
            title="Exporta la página visible"
          >
            <Download size={14} aria-hidden="true" /> Exportar
          </button>
          <button className="btn btn-primary" onClick={openPos}>
            <Plus size={14} strokeWidth={2} aria-hidden="true" /> Nueva venta
          </button>
        </div>
      </div>

      <div className="filterbar">
        <div className="filter-search">
          <Search size={14} aria-hidden="true" />
          <input type="search" aria-label="Buscar ventas" value={q}
            onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="#123, cliente, patente…" />
        </div>
        <div className="seg" role="group" aria-label="Estado">
          {(['todas', 'COMPLETADA', 'ANULADA'] as FiltroEstado[]).map((id) => (
            <button key={id} aria-pressed={estado === id} className={`seg-btn${estado === id ? ' is-active' : ''}`}
              onClick={() => { setEstado(id); setPage(0); }}>
              {id === 'todas' ? 'Todas' : id === 'COMPLETADA' ? 'Completadas' : 'Anuladas'}
            </button>
          ))}
        </div>
        <select className="input select" value={medio} aria-label="Medio de pago"
          onChange={(e) => { setMedio(e.target.value as MedioPago | ''); setPage(0); }}>
          <option value="">Todos los medios</option>
          {MEDIOS_PAGO.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
      </div>

      <div className="card no-pad">
        <div className="table-wrap">
          <table className="table table-clickable">
            <thead>
              <tr>
                <th scope="col" style={{ width: 80 }}>N°</th>
                <th scope="col" style={{ width: 140 }}>Fecha</th>
                <th scope="col">Cliente / detalle</th>
                <th scope="col" style={{ width: 120 }}>Pago</th>
                <th scope="col" style={{ width: 70, textAlign: 'right' }}>Ítems</th>
                <th scope="col" style={{ width: 130, textAlign: 'right' }}>Total</th>
                <th scope="col" style={{ width: 130 }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}><td colSpan={7}><div className="skeleton" style={{ height: 14 }} /></td></tr>
              ))}
              {isError && (
                <tr>
                  <td colSpan={7} className="empty-state">
                    <div className="empty-title" style={{ color: 'var(--danger)' }}>No se pudieron cargar las ventas</div>
                    <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => refetch()}>Reintentar</button>
                  </td>
                </tr>
              )}
              {!isLoading && !isError && list.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-state">
                    <div className="empty-title">Sin ventas</div>
                    <div className="empty-sub">{q || estado !== 'todas' || medio ? 'Probá con otros filtros.' : 'Registrá la primera con F2.'}</div>
                  </td>
                </tr>
              )}
              {list.map((v) => (
                <tr key={v.id} onClick={() => abrir(v)} role="button" tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(v); } }}>
                  <td className="td-id">#{v.id}</td>
                  <td className="td-muted">{fmtDateTime(v.fecha)}</td>
                  <td className="td-wrap">
                    {v.clienteNombre || v.vehiculoPatente ? (
                      <div className="td-product">
                        <span className="td-product-name">{v.clienteNombre}</span>
                        {v.vehiculoPatente && <span className="td-product-code">{v.vehiculoPatente} {v.vehiculoDescripcion}</span>}
                      </div>
                    ) : (
                      <span className="td-muted">{v.observaciones || v.detalles.map((d) => d.productoNombre).join(', ')}</span>
                    )}
                  </td>
                  <td>{medioLabel(v.medioPago)}</td>
                  <td className="td-num">{v.cantidadItems}</td>
                  <td className="td-num"><strong>{fmtARS(v.total)}</strong></td>
                  <td><EstadoChip estado={v.estado} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && <Pager page={data} onPage={setPage} noun="ventas" />}
      </div>

      <VentaDrawer ventaId={ventaId} onClose={cerrar} />
    </main>
  );
}
