import { useState, useMemo, useEffect } from 'react';
import { Plus, Download, Trash2, RotateCcw } from 'lucide-react';
import {
  useProductos, useCrearProducto, useActualizarProducto,
  useEliminarProducto, useRestaurarProducto,
  type ProductoRequest,
} from '../hooks/useProductos';
import type { ProductoResponse, Categoria, AuthUser } from '../types/api';
import { fmtARS } from '../lib/format';
import Drawer from '../components/Drawer';
import ConfirmModal from '../components/ConfirmModal';

type Filtro = 'activos' | 'bajo-stock' | 'inactivos';
type CatFiltro = 'todas' | Categoria;
type SortDir = 'asc' | 'desc';
type SortState = { key: string; dir: SortDir };

const EMPTY_FORM: ProductoRequest = {
  nombre: '', codigo: '', categoria: 'REPUESTO', descripcion: '',
  precioCosto: 0, precioVenta: 0, stockActual: 0, stockMinimo: 0,
};

function StockBadge({ p }: { p: ProductoResponse }) {
  if (!p.activo) return <span className="status-chip status-inactive">Inactivo</span>;
  if (p.stockActual === 0) return <span className="status-chip status-out">Sin stock</span>;
  if (p.stockActual <= p.stockMinimo * 0.34) return <span className="status-chip status-critical">Crítico</span>;
  if (p.stockActual <= p.stockMinimo) return <span className="status-chip status-low">Bajo</span>;
  return <span className="status-chip status-ok">OK</span>;
}

function SortableTh({ label, k, sortBy, onSort, style }: {
  label: string; k: string; sortBy: SortState;
  onSort: (k: string) => void; style?: React.CSSProperties;
}) {
  const active = sortBy.key === k;
  return (
    <th style={style} className="sortable-th" onClick={() => onSort(k)}>
      <span>{label}</span>
      <svg viewBox="0 0 12 12" width="10" height="10" fill="none" className={`sort-icon${active ? ' is-active' : ''}`}>
        {active && sortBy.dir === 'desc'
          ? <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          : <path d="M3 7l3-3 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>}
      </svg>
    </th>
  );
}

function ProductoDrawer({ open, onClose, producto, onAjustarStock }: {
  open: boolean; onClose: () => void; producto: ProductoResponse | null;
  onAjustarStock?: (productoId: number) => void;
}) {
  const isEdit = !!producto;
  const [form, setForm] = useState<ProductoRequest>({ ...EMPTY_FORM });
  const crear = useCrearProducto();
  const actualizar = useActualizarProducto();

  useEffect(() => {
    if (!open) return;
    setForm(producto ? {
      nombre: producto.nombre,
      codigo: producto.codigo ?? '',
      categoria: producto.categoria,
      descripcion: producto.descripcion ?? '',
      precioCosto: Number(producto.precioCosto),
      precioVenta: Number(producto.precioVenta),
      stockActual: producto.stockActual,
      stockMinimo: producto.stockMinimo,
    } : { ...EMPTY_FORM });
  }, [open, producto]);

  const setStr = (k: keyof ProductoRequest) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const setNum = (k: keyof ProductoRequest) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: Number(e.target.value) }));

  const margen = form.precioCosto > 0
    ? ((form.precioVenta - form.precioCosto) / form.precioCosto) * 100
    : null;

  const isPending = crear.isPending || actualizar.isPending;

  const handleSave = () => {
    if (!form.nombre.trim()) return;
    if (isEdit && producto) {
      actualizar.mutate({ id: producto.id, data: form }, { onSuccess: onClose });
    } else {
      crear.mutate(form, { onSuccess: onClose });
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar producto' : 'Nuevo producto'}
      subtitle={isEdit ? `#${producto?.id} · ${producto?.codigo || 'sin código'}` : 'Completá los datos. Podés ajustar después.'}
      footer={
        <>
          {isEdit && producto && (
            <button
              className="btn btn-ghost"
              style={{ marginRight: 'auto' }}
              onClick={() => { onClose(); onAjustarStock?.(producto.id); }}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                <path d="M4 12h16M9 6l-5 6 5 6M15 6l5 6-5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Ajustar stock
            </button>
          )}
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={isPending || !form.nombre.trim()}>
            {isEdit ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </>
      }
    >
      <div className="form">
        <div className="form-section">
          <div className="form-section-title">Datos básicos</div>
          <label className="field">
            <span className="field-label">Nombre <span className="field-req">*</span></span>
            <div className="field-control">
              <input className="input" value={form.nombre} onChange={setStr('nombre')} placeholder="Ej: Filtro de aceite Mann W712"/>
            </div>
          </label>
          <div className="form-row form-row-2">
            <label className="field">
              <span className="field-label">Código</span>
              <div className="field-control">
                <input className="input mono" value={form.codigo} onChange={setStr('codigo')} placeholder="FLT-W712"/>
              </div>
            </label>
            <label className="field">
              <span className="field-label">Categoría</span>
              <div className="field-control">
                <div className="seg seg-full">
                  <button type="button" className={`seg-btn${form.categoria === 'REPUESTO' ? ' is-active' : ''}`}
                    onClick={() => setForm((f) => ({ ...f, categoria: 'REPUESTO' }))}>Repuesto</button>
                  <button type="button" className={`seg-btn${form.categoria === 'LUBRICANTE' ? ' is-active' : ''}`}
                    onClick={() => setForm((f) => ({ ...f, categoria: 'LUBRICANTE' }))}>Lubricante</button>
                </div>
              </div>
            </label>
          </div>
          <label className="field">
            <span className="field-label">Descripción</span>
            <div className="field-control">
              <textarea className="input" rows={2} value={form.descripcion} onChange={setStr('descripcion')} placeholder="Notas, compatibilidades, marca…"/>
            </div>
          </label>
        </div>

        <div className="form-section">
          <div className="form-section-title">Precios</div>
          <div className="form-row form-row-2">
            <label className="field">
              <span className="field-label">Precio de costo</span>
              <div className="field-control has-prefix">
                <span className="field-prefix">$</span>
                <input className="input" type="number" min="0" value={form.precioCosto} onChange={setNum('precioCosto')}/>
              </div>
            </label>
            <label className="field">
              <span className="field-label">Precio de venta</span>
              <div className="field-control has-prefix">
                <span className="field-prefix">$</span>
                <input className="input" type="number" min="0" value={form.precioVenta} onChange={setNum('precioVenta')}/>
              </div>
            </label>
          </div>
          {margen !== null && (
            <div className="margin-pill">
              <span>Margen</span>
              <strong className={margen < 20 ? 'is-low' : 'is-ok'}>{margen.toFixed(1)}%</strong>
            </div>
          )}
        </div>

        <div className="form-section">
          <div className="form-section-title">Stock</div>
          <div className="form-row form-row-2">
            <label className="field">
              <span className="field-label">Stock actual</span>
              <div className="field-control">
                <input className="input" type="number" min="0" value={form.stockActual} onChange={setNum('stockActual')}/>
              </div>
            </label>
            <label className="field">
              <span className="field-label">Stock mínimo</span>
              <div className="field-control">
                <input className="input" type="number" min="0" value={form.stockMinimo} onChange={setNum('stockMinimo')}/>
              </div>
            </label>
          </div>
          {form.stockMinimo > 0 && form.stockActual <= form.stockMinimo && (
            <div className="hint hint-warn">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                <path d="M12 9v4M12 17v.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
              </svg>
              Este producto quedará marcado como bajo stock.
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}

export default function Productos({ onAjustarStock, user }: { onAjustarStock?: (productoId: number) => void; user?: AuthUser | null } = {}) {
  const { data: productos = [], isLoading } = useProductos();
  const eliminar = useEliminarProducto();
  const restaurar = useRestaurarProducto();
  const isAdmin = user?.rol === 'ADMIN';

  const [q, setQ] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('activos');
  const [categoria, setCategoria] = useState<CatFiltro>('todas');
  const [sortBy, setSortBy] = useState<SortState>({ key: 'nombre', dir: 'asc' });
  const [drawer, setDrawer] = useState<{ open: boolean; producto: ProductoResponse | null }>({ open: false, producto: null });
  const [confirm, setConfirm] = useState<{ open: boolean; producto: ProductoResponse | null }>({ open: false, producto: null });

  const toggleSort = (key: string) =>
    setSortBy((s) => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });

  const filtered = useMemo(() => {
    let out = [...productos];
    if (filtro === 'activos') out = out.filter((p) => p.activo);
    else if (filtro === 'inactivos') out = out.filter((p) => !p.activo);
    else if (filtro === 'bajo-stock') out = out.filter((p) => p.activo && p.stockActual <= p.stockMinimo);
    if (categoria !== 'todas') out = out.filter((p) => p.categoria === categoria);
    if (q.trim()) {
      const qq = q.toLowerCase();
      out = out.filter((p) =>
        p.nombre.toLowerCase().includes(qq) ||
        (p.codigo ?? '').toLowerCase().includes(qq) ||
        (p.descripcion ?? '').toLowerCase().includes(qq)
      );
    }
    out.sort((a, b) => {
      const av = a[sortBy.key as keyof ProductoResponse] ?? 0;
      const bv = b[sortBy.key as keyof ProductoResponse] ?? 0;
      const sign = sortBy.dir === 'asc' ? 1 : -1;
      if (typeof av === 'string') return (av as string).localeCompare(bv as string) * sign;
      return (Number(av) - Number(bv)) * sign;
    });
    return out;
  }, [productos, filtro, categoria, q, sortBy]);

  const countAll = productos.filter((p) => p.activo).length;
  const countBajo = productos.filter((p) => p.activo && p.stockActual <= p.stockMinimo).length;
  const countInact = productos.filter((p) => !p.activo).length;

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Catálogo</div>
          <h1 className="page-title">Productos</h1>
          <p className="page-sub">{countAll} activos · {countBajo} bajo stock · {countInact} inactivos.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost">
            <Download size={14} strokeWidth={1.8}/>
            Exportar
          </button>
          <button className="btn btn-primary" onClick={() => setDrawer({ open: true, producto: null })}>
            <Plus size={14} strokeWidth={2}/>
            Nuevo producto
          </button>
        </div>
      </div>

      <div className="filterbar">
        <div className="filter-search">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6"/>
            <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, código o descripción…"/>
        </div>
        <div className="seg">
          <button className={`seg-btn${filtro === 'activos' ? ' is-active' : ''}`} onClick={() => setFiltro('activos')}>
            Activos <span className="seg-count">{countAll}</span>
          </button>
          <button className={`seg-btn${filtro === 'bajo-stock' ? ' is-active' : ''}`} onClick={() => setFiltro('bajo-stock')}>
            Bajo stock <span className="seg-count seg-count-warn">{countBajo}</span>
          </button>
          <button className={`seg-btn${filtro === 'inactivos' ? ' is-active' : ''}`} onClick={() => setFiltro('inactivos')}>
            Inactivos <span className="seg-count">{countInact}</span>
          </button>
        </div>
        <div className="seg">
          {(['todas', 'REPUESTO', 'LUBRICANTE'] as CatFiltro[]).map((id) => (
            <button key={id} className={`seg-btn${categoria === id ? ' is-active' : ''}`} onClick={() => setCategoria(id)}>
              {id === 'todas' ? 'Todas' : id === 'REPUESTO' ? 'Repuestos' : 'Lubricantes'}
            </button>
          ))}
        </div>
      </div>

      <div className="card no-pad">
        <div className="table-wrap">
          <table className="table table-clickable">
            <thead>
              <tr>
                <SortableTh label="Producto" k="nombre" sortBy={sortBy} onSort={toggleSort}/>
                <SortableTh label="Categoría" k="categoria" sortBy={sortBy} onSort={toggleSort} style={{ width: 130 }}/>
                <SortableTh label="P. costo" k="precioCosto" sortBy={sortBy} onSort={toggleSort} style={{ width: 120, textAlign: 'right' }}/>
                <SortableTh label="P. venta" k="precioVenta" sortBy={sortBy} onSort={toggleSort} style={{ width: 130, textAlign: 'right' }}/>
                <SortableTh label="Stock" k="stockActual" sortBy={sortBy} onSort={toggleSort} style={{ width: 130, textAlign: 'right' }}/>
                <th style={{ width: 110 }}>Estado</th>
                <th style={{ width: 60 }} aria-label="acciones"/>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={7} className="empty-state">
                  <div className="empty-title">Cargando…</div>
                </td></tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={7} className="empty-state">
                  <div className="empty-title">Nada por acá</div>
                  <div className="empty-sub">Ajustá los filtros o creá un producto nuevo.</div>
                </td></tr>
              )}
              {filtered.map((p) => {
                const margen = p.precioCosto > 0
                  ? ((Number(p.precioVenta) - Number(p.precioCosto)) / Number(p.precioCosto)) * 100
                  : 0;
                return (
                  <tr key={p.id} onClick={() => setDrawer({ open: true, producto: p })}>
                    <td>
                      <div className="td-product">
                        <span className="td-product-name">{p.nombre}</span>
                        {p.codigo && <span className="td-product-code">{p.codigo}</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`chip ${p.categoria === 'LUBRICANTE' ? 'chip-lub' : 'chip-rep'}`}>
                        {p.categoria === 'LUBRICANTE' ? 'Lubricante' : 'Repuesto'}
                      </span>
                    </td>
                    <td className="td-num td-muted">{fmtARS(Number(p.precioCosto))}</td>
                    <td className="td-num">
                      <div className="price-cell">
                        <strong>{fmtARS(Number(p.precioVenta))}</strong>
                        {margen > 0 && <span className="price-margin">{margen.toFixed(0)}%</span>}
                      </div>
                    </td>
                    <td className="td-num">
                      <div className="stock-cell">
                        <strong>{p.stockActual}</strong>
                        <span className="stock-min">/ {p.stockMinimo} mín</span>
                      </div>
                    </td>
                    <td><StockBadge p={p}/></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="row-action-group">
                        {p.activo
                          ? isAdmin && (
                              <button className="row-action" aria-label="Dar de baja" title="Dar de baja"
                                onClick={() => setConfirm({ open: true, producto: p })}>
                                <Trash2 size={14} strokeWidth={1.6}/>
                              </button>
                            )
                          : (
                              <button className="row-action row-action-success" aria-label="Reactivar" title="Reactivar"
                                onClick={() => restaurar.mutate(p.id)}>
                                <RotateCcw size={14} strokeWidth={1.8}/>
                              </button>
                            )
                        }
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="table-foot">
          <span>{filtered.length} de {productos.length} productos</span>
        </div>
      </div>

      <ProductoDrawer
        open={drawer.open}
        producto={drawer.producto}
        onClose={() => setDrawer({ open: false, producto: null })}
        onAjustarStock={onAjustarStock}
      />

      <ConfirmModal
        open={confirm.open}
        title="Dar de baja producto"
        description={`"${confirm.producto?.nombre}" quedará marcado como inactivo. Podés reactivarlo después.`}
        confirmLabel="Dar de baja"
        danger
        onConfirm={() => {
          if (confirm.producto) eliminar.mutate(confirm.producto.id);
          setConfirm({ open: false, producto: null });
        }}
        onCancel={() => setConfirm({ open: false, producto: null })}
      />
    </main>
  );
}
