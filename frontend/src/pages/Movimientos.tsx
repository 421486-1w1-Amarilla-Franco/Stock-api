import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Plus, Search } from 'lucide-react';
import { useMovimientos, useConteoMovimientos } from '../hooks/useMovimientos';
import TipoChip from '../components/TipoChip';
import Pager from '../components/Pager';
import { fmtDateTime, initials } from '../lib/format';
import { useDebounced } from '../lib/useDebounced';
import { useApp } from '../lib/app-context';
import type { TipoMovimiento } from '../types/api';

type FiltroTipo = 'TODOS' | TipoMovimiento;

const FILTROS: { id: FiltroTipo; label: string }[] = [
  { id: 'TODOS', label: 'Todos' },
  { id: 'ENTRADA', label: 'Entradas' },
  { id: 'SALIDA', label: 'Salidas' },
  { id: 'AJUSTE', label: 'Ajustes' },
];

export default function Movimientos() {
  const { openMovimiento } = useApp();
  const [tipo, setTipo] = useState<FiltroTipo>('TODOS');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const qd = useDebounced(q.trim(), 300);

  const { data, isLoading, isError, isFetching, refetch } = useMovimientos({
    q: qd, tipo: tipo === 'TODOS' ? undefined : tipo, page,
  });
  const { data: conteo } = useConteoMovimientos();
  const list = data?.content ?? [];

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Movimientos</h1>
          <p className="page-sub">
            Cada cambio de stock, con quién y por qué. {conteo && <>{conteo.TODOS} en total.</>}
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => openMovimiento()}>
            <Plus size={14} strokeWidth={2} aria-hidden="true" /> Registrar movimiento
          </button>
        </div>
      </div>

      <div className="filterbar">
        <div className="filter-search">
          <Search size={14} aria-hidden="true" />
          <input
            type="search"
            aria-label="Buscar movimientos"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(0); }}
            placeholder="Producto, código, nota o usuario…"
          />
        </div>
        <div className="seg" role="group" aria-label="Tipo">
          {FILTROS.map((opt) => (
            <button
              key={opt.id}
              aria-pressed={tipo === opt.id}
              className={`seg-btn${tipo === opt.id ? ' is-active' : ''}`}
              onClick={() => { setTipo(opt.id); setPage(0); }}
            >
              {opt.label}
              {conteo && <span className="seg-count">{conteo[opt.id]}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className={`card no-pad${isFetching && !isLoading ? ' is-refreshing' : ''}`}>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col" style={{ width: 70 }}>#</th>
                <th scope="col">Producto</th>
                <th scope="col" style={{ width: 110 }}>Tipo</th>
                <th scope="col" style={{ width: 90, textAlign: 'right' }}>Cant.</th>
                <th scope="col" style={{ width: 130, textAlign: 'right' }}>Stock</th>
                <th scope="col" style={{ width: 160 }}>Usuario</th>
                <th scope="col" style={{ width: 200 }}>Nota</th>
                <th scope="col" style={{ width: 130, textAlign: 'right' }}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}><td colSpan={8}><div className="skeleton" style={{ height: 14 }} /></td></tr>
              ))}
              {isError && (
                <tr>
                  <td colSpan={8} className="empty-state">
                    <div className="empty-title" style={{ color: 'var(--danger)' }}>No se pudieron cargar los movimientos</div>
                    <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => refetch()}>Reintentar</button>
                  </td>
                </tr>
              )}
              {!isLoading && !isError && list.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-state">
                    <div className="empty-title">Sin movimientos</div>
                    <div className="empty-sub">{q || tipo !== 'TODOS' ? 'Probá quitar filtros.' : 'Aparecen al vender, comprar o ajustar stock.'}</div>
                  </td>
                </tr>
              )}
              {list.map((m) => {
                const neg = m.stockPosterior < m.stockAnterior;
                return (
                  <tr key={m.id}>
                    <td className="td-id">#{m.id}</td>
                    <td>
                      <div className="td-product">
                        <Link className="td-product-name link" to={`/productos/${m.productoId}`}>{m.productoNombre}</Link>
                        {m.productoCodigo && <span className="td-product-code">{m.productoCodigo}</span>}
                      </div>
                    </td>
                    <td><TipoChip tipo={m.tipo} /></td>
                    <td className={`td-num ${neg ? 'is-neg' : 'is-pos'}`}>{neg ? '−' : '+'}{Math.abs(m.stockPosterior - m.stockAnterior)}</td>
                    <td className="td-num">
                      <div className="td-stock">
                        <span className="stock-prev">{m.stockAnterior}</span>
                        <ArrowRight size={10} aria-hidden="true" />
                        <span>{m.stockPosterior}</span>
                      </div>
                    </td>
                    <td>
                      <div className="td-user">
                        <div className="avatar avatar-sm" aria-hidden="true">{initials(m.usuarioNombre)}</div>
                        <span>{m.usuarioNombre}</span>
                      </div>
                    </td>
                    <td className="td-muted td-wrap">{m.nota ?? '—'}</td>
                    <td className="td-num td-muted">{fmtDateTime(m.fecha)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {data && <Pager page={data} onPage={setPage} noun="movimientos" />}
      </div>
    </main>
  );
}
