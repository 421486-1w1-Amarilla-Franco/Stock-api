import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Pencil, SlidersHorizontal, PackagePlus } from 'lucide-react';
import { useProductos } from '../hooks/useProductos';
import { useMovimientosProducto } from '../hooks/useMovimientos';
import { useApp } from '../lib/app-context';
import { fmtARS, fmtDateTime } from '../lib/format';
import TipoChip from '../components/TipoChip';
import { ProductoDrawer } from './Productos';

export default function ProductoDetalle() {
  const { id } = useParams();
  const productoId = Number(id);
  const { openMovimiento } = useApp();
  const { data: productos = [], isLoading } = useProductos();
  const { data: movs = [], isLoading: loadingMov } = useMovimientosProducto(productoId);
  const [editOpen, setEditOpen] = useState(false);

  const p = productos.find((x) => x.id === productoId);

  if (isLoading) {
    return <main className="page"><div className="skeleton" style={{ height: 32, width: 280 }} /></main>;
  }
  if (!p) {
    return (
      <main className="page">
        <Link to="/productos" className="back-link"><ArrowLeft size={14} /> Productos</Link>
        <div className="empty-state card"><div className="empty-title">Producto no encontrado</div></div>
      </main>
    );
  }

  const margen = p.precioCosto > 0 ? ((p.precioVenta - p.precioCosto) / p.precioCosto) * 100 : null;
  const bajo = p.activo && p.stockActual <= p.stockMinimo;
  const vendidas = movs.filter((m) => m.tipo === 'SALIDA' && (m.nota ?? '').startsWith('Venta')).reduce((s, m) => s + m.cantidad, 0);

  return (
    <main className="page">
      <div>
        <Link to="/productos" className="back-link"><ArrowLeft size={14} aria-hidden="true" /> Productos</Link>
        <div className="page-head">
          <div>
            <h1 className="page-title">{p.nombre}</h1>
            <p className="page-sub detail-meta">
              {p.codigo && <span className="chip chip-ghost">{p.codigo}</span>}
              <span className={`chip ${p.categoria === 'LUBRICANTE' ? 'chip-lub' : 'chip-rep'}`}>
                {p.categoria === 'LUBRICANTE' ? 'Lubricante' : 'Repuesto'}
              </span>
              {!p.activo && <span className="status-chip status-inactive">Dado de baja</span>}
              {p.descripcion && <span>{p.descripcion}</span>}
            </p>
          </div>
          <div className="page-actions">
            <button className="btn btn-ghost" onClick={() => setEditOpen(true)}><Pencil size={14} aria-hidden="true" /> Editar</button>
            <button className="btn btn-ghost" onClick={() => openMovimiento(p.id, 'AJUSTE')} disabled={!p.activo}>
              <SlidersHorizontal size={14} aria-hidden="true" /> Ajustar stock
            </button>
            <button className="btn btn-primary" onClick={() => openMovimiento(p.id, 'ENTRADA')} disabled={!p.activo}>
              <PackagePlus size={14} aria-hidden="true" /> Registrar entrada
            </button>
          </div>
        </div>
      </div>

      <div className="kpi-grid">
        <div className={`kpi-card${bajo ? ' kpi-warn' : ''}`}>
          <span className="kpi-label">Stock</span>
          <div className="kpi-value">{p.stockActual} <small>u.</small></div>
          <div className="kpi-foot"><span className="kpi-sub">{bajo ? 'En o bajo el mínimo' : 'Mínimo'} · {p.stockMinimo} u.</span></div>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Precio de venta</span>
          <div className="kpi-value">{fmtARS(p.precioVenta)}</div>
          <div className="kpi-foot"><span className="kpi-sub">Costo {fmtARS(p.precioCosto)}{margen !== null && ` · margen ${margen.toFixed(0)}%`}</span></div>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Valor en depósito</span>
          <div className="kpi-value">{fmtARS(p.precioCosto * p.stockActual)}</div>
          <div className="kpi-foot"><span className="kpi-sub">al costo · {fmtARS(p.precioVenta * p.stockActual)} a precio de venta</span></div>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Unidades vendidas</span>
          <div className="kpi-value">{vendidas}</div>
          <div className="kpi-foot"><span className="kpi-sub">en todo el historial</span></div>
        </div>
      </div>

      <section className="card no-pad">
        <div className="card-head">
          <div>
            <h2 className="card-title">Historial de stock</h2>
            <div className="card-sub">{movs.length} movimiento{movs.length === 1 ? '' : 's'}, del más reciente al más antiguo</div>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col" style={{ width: 150 }}>Fecha</th>
                <th scope="col" style={{ width: 110 }}>Tipo</th>
                <th scope="col" style={{ width: 90, textAlign: 'right' }}>Cant.</th>
                <th scope="col" style={{ width: 130, textAlign: 'right' }}>Stock</th>
                <th scope="col">Detalle</th>
                <th scope="col" style={{ width: 160 }}>Usuario</th>
              </tr>
            </thead>
            <tbody>
              {loadingMov && <tr><td colSpan={6}><div className="skeleton" style={{ height: 14 }} /></td></tr>}
              {!loadingMov && movs.length === 0 && <tr><td colSpan={6} className="card-empty">Sin movimientos todavía.</td></tr>}
              {movs.map((m) => {
                const neg = m.stockPosterior < m.stockAnterior;
                const venta = /^Venta #(\d+)/.exec(m.nota ?? '');
                return (
                  <tr key={m.id}>
                    <td className="td-muted">{fmtDateTime(m.fecha)}</td>
                    <td><TipoChip tipo={m.tipo} /></td>
                    <td className={`td-num ${neg ? 'is-neg' : 'is-pos'}`}>{neg ? '−' : '+'}{Math.abs(m.stockPosterior - m.stockAnterior)}</td>
                    <td className="td-num">
                      <div className="td-stock">
                        <span className="stock-prev">{m.stockAnterior}</span>
                        <ArrowRight size={10} aria-hidden="true" />
                        <span>{m.stockPosterior}</span>
                      </div>
                    </td>
                    <td className="td-wrap">
                      {venta ? <Link className="link" to={`/ventas?venta=${venta[1]}`}>{m.nota}</Link> : (m.nota ?? '—')}
                    </td>
                    <td>{m.usuarioNombre}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <ProductoDrawer open={editOpen} producto={p} onClose={() => setEditOpen(false)} />
    </main>
  );
}
