import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useClientes } from '../hooks/useTaller';
import { ClienteDrawer } from '../components/ClienteForms';
import { useDebounced } from '../lib/useDebounced';
import { initials } from '../lib/format';

export default function Clientes() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const qd = useDebounced(q.trim().toLowerCase(), 250);
  const { data: clientes = [], isLoading, isFetching } = useClientes(qd);
  const [nuevo, setNuevo] = useState(false);

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-sub">Clientes con sus vehículos e historial de trabajos.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setNuevo(true)}>
            <Plus size={14} strokeWidth={2} aria-hidden="true" /> Nuevo cliente
          </button>
        </div>
      </div>

      <div className="filterbar">
        <div className="filter-search">
          <Search size={14} aria-hidden="true" />
          <input type="search" aria-label="Buscar clientes" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Nombre, teléfono, documento o patente…" />
        </div>
      </div>

      <div className={`card no-pad${isFetching && !isLoading ? ' is-refreshing' : ''}`}>
        <div className="table-wrap">
          <table className="table table-clickable">
            <thead>
              <tr>
                <th scope="col">Cliente</th>
                <th scope="col" style={{ width: 160 }}>Teléfono</th>
                <th scope="col">Vehículos</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={3}><div className="skeleton" style={{ height: 14 }} /></td></tr>
              ))}
              {!isLoading && clientes.length === 0 && (
                <tr>
                  <td colSpan={3} className="empty-state">
                    <div className="empty-title">{q ? 'Ningún cliente coincide' : 'Todavía no hay clientes'}</div>
                    <div className="empty-sub">{q ? 'Probá con otra búsqueda.' : 'Cargalos acá o directo desde una venta.'}</div>
                  </td>
                </tr>
              )}
              {clientes.map((c) => (
                <tr key={c.id} role="button" tabIndex={0} onClick={() => navigate(`/clientes/${c.id}`)}
                  onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/clientes/${c.id}`); }}>
                  <td>
                    <div className="td-user">
                      <div className="avatar avatar-sm" aria-hidden="true">{initials(c.nombre)}</div>
                      <div className="td-product">
                        <span className="td-product-name">{c.nombre}</span>
                        {c.documento && <span className="td-product-code">{c.documento}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="td-muted">{c.telefono ?? '—'}</td>
                  <td>
                    <div className="chip-row">
                      {c.vehiculos.length === 0 && <span className="td-muted">—</span>}
                      {c.vehiculos.map((v) => (
                        <span key={v.id} className="plate" title={[v.marca, v.modelo].filter(Boolean).join(' ')}>{v.patente}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-foot">{clientes.length} cliente{clientes.length === 1 ? '' : 's'}</div>
      </div>

      <ClienteDrawer open={nuevo} cliente={null} onClose={() => setNuevo(false)} onSaved={(c) => navigate(`/clientes/${c.id}`)} />
    </main>
  );
}
