import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Car, Pencil, Plus, Phone, Mail } from 'lucide-react';
import { useCliente, useVentasCliente } from '../hooks/useTaller';
import { ClienteDrawer, VehiculoDrawer } from '../components/ClienteForms';
import { fmtARS, fmtDateTime } from '../lib/format';
import type { VehiculoResponse } from '../types/api';

export default function ClienteDetalle() {
  const id = Number(useParams().id);
  const { data: c, isLoading, isError } = useCliente(id);
  const { data: ventas = [] } = useVentasCliente(id);
  const [editOpen, setEditOpen] = useState(false);
  const [vehDrawer, setVehDrawer] = useState<{ open: boolean; v: VehiculoResponse | null }>({ open: false, v: null });
  const [filtroVeh, setFiltroVeh] = useState<number | null>(null);

  if (isLoading) return <main className="page"><div className="skeleton" style={{ height: 32, width: 260 }} /></main>;
  if (isError || !c) {
    return (
      <main className="page">
        <Link to="/clientes" className="back-link"><ArrowLeft size={14} /> Clientes</Link>
        <div className="card empty-state"><div className="empty-title">Cliente no encontrado</div></div>
      </main>
    );
  }

  const activas = ventas.filter((v) => v.estado !== 'ANULADA');
  const totalGastado = activas.reduce((s, v) => s + v.total, 0);
  const lista = filtroVeh ? ventas.filter((v) => v.vehiculoId === filtroVeh) : ventas;

  return (
    <main className="page">
      <div>
        <Link to="/clientes" className="back-link"><ArrowLeft size={14} aria-hidden="true" /> Clientes</Link>
        <div className="page-head">
          <div>
            <h1 className="page-title">{c.nombre}</h1>
            <p className="page-sub detail-meta">
              {c.telefono && <a className="link" href={`tel:${c.telefono}`}><Phone size={12} aria-hidden="true" /> {c.telefono}</a>}
              {c.email && <a className="link" href={`mailto:${c.email}`}><Mail size={12} aria-hidden="true" /> {c.email}</a>}
              {c.documento && <span>Doc. {c.documento}</span>}
              {c.notas && <span>{c.notas}</span>}
            </p>
          </div>
          <div className="page-actions">
            <button className="btn btn-ghost" onClick={() => setEditOpen(true)}><Pencil size={14} aria-hidden="true" /> Editar</button>
          </div>
        </div>
      </div>

      <div className="kpi-grid kpi-grid-3">
        <div className="kpi-card"><span className="kpi-label">Visitas</span><div className="kpi-value">{activas.length}</div></div>
        <div className="kpi-card"><span className="kpi-label">Total facturado</span><div className="kpi-value">{fmtARS(totalGastado)}</div></div>
        <div className="kpi-card">
          <span className="kpi-label">Última visita</span>
          <div className="kpi-value kpi-value-sm">{activas[0] ? fmtDateTime(activas[0].fecha) : '—'}</div>
        </div>
      </div>

      <section className="card">
        <div className="card-head">
          <div>
            <h2 className="card-title">Vehículos</h2>
            <div className="card-sub">Tocá uno para ver solo sus trabajos.</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setVehDrawer({ open: true, v: null })}>
            <Plus size={14} aria-hidden="true" /> Agregar
          </button>
        </div>
        {c.vehiculos.length === 0 ? (
          <div className="card-empty">Sin vehículos. Agregá uno para registrar su historial y kilometraje.</div>
        ) : (
          <div className="veh-grid">
            {c.vehiculos.map((v) => (
              <div key={v.id} className={`veh-card${filtroVeh === v.id ? ' is-active' : ''}`}>
                <button className="veh-main" aria-pressed={filtroVeh === v.id} onClick={() => setFiltroVeh(filtroVeh === v.id ? null : v.id)}>
                  <Car size={16} aria-hidden="true" />
                  <span className="plate">{v.patente}</span>
                  <span className="veh-desc">{[v.marca, v.modelo, v.anio].filter(Boolean).join(' ') || 'Sin datos'}</span>
                  {v.km != null && <span className="veh-km num">{v.km.toLocaleString('es-AR')} km</span>}
                </button>
                <button className="icon-btn icon-btn-sm" onClick={() => setVehDrawer({ open: true, v })} aria-label={`Editar ${v.patente}`}>
                  <Pencil size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card no-pad">
        <div className="card-head">
          <div>
            <h2 className="card-title">Historial</h2>
            <div className="card-sub">{lista.length} venta{lista.length === 1 ? '' : 's'}{filtroVeh && ' de este vehículo'}</div>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col" style={{ width: 80 }}>N°</th>
                <th scope="col" style={{ width: 140 }}>Fecha</th>
                <th scope="col" style={{ width: 110 }}>Vehículo</th>
                <th scope="col">Trabajo</th>
                <th scope="col" style={{ width: 120, textAlign: 'right' }}>Km</th>
                <th scope="col" style={{ width: 130, textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {lista.length === 0 && <tr><td colSpan={6} className="card-empty">Sin ventas registradas.</td></tr>}
              {lista.map((v) => (
                <tr key={v.id} className={v.estado === 'ANULADA' ? 'is-muted' : undefined}>
                  <td className="td-id"><Link className="link" to={`/ventas?venta=${v.id}`}>#{v.id}</Link></td>
                  <td className="td-muted">{fmtDateTime(v.fecha)}</td>
                  <td>{v.vehiculoPatente ? <span className="plate">{v.vehiculoPatente}</span> : '—'}</td>
                  <td className="td-wrap">
                    {v.detalles.map((d) => `${d.cantidad}× ${d.productoNombre}`).join(', ')}
                    {v.manoObra > 0 && ` + mano de obra`}
                    {v.estado === 'ANULADA' && ' (anulada)'}
                  </td>
                  <td className="td-num td-muted">{v.kmVehiculo != null ? v.kmVehiculo.toLocaleString('es-AR') : '—'}</td>
                  <td className="td-num"><strong>{fmtARS(v.total)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ClienteDrawer open={editOpen} cliente={c} onClose={() => setEditOpen(false)} />
      <VehiculoDrawer open={vehDrawer.open} clienteId={c.id} vehiculo={vehDrawer.v} onClose={() => setVehDrawer({ open: false, v: null })} />
    </main>
  );
}
