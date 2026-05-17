import { useState, useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { useMovimientos } from '../hooks/useMovimientos';
import TipoChip from '../components/TipoChip';
import { fmtDateTime, initials } from '../lib/format';
import type { TipoMovimiento } from '../types/api';

type FiltroTipo = 'todos' | TipoMovimiento;

export default function Movimientos({ onRegistrarMovimiento }: { onRegistrarMovimiento?: () => void } = {}) {
  const { data: movimientos = [], isLoading, isError } = useMovimientos();
  const [tipo, setTipo] = useState<FiltroTipo>('todos');
  const [q, setQ] = useState('');
  const [productoFilter, setProductoFilter] = useState<{ id: number; nombre: string } | null>(null);

  const list = useMemo(() => {
    let out = movimientos;
    if (tipo !== 'todos') out = out.filter((m) => m.tipo === tipo);
    if (productoFilter) out = out.filter((m) => m.productoId === productoFilter.id);
    if (q.trim()) {
      const qq = q.toLowerCase();
      out = out.filter(
        (m) =>
          m.productoNombre.toLowerCase().includes(qq) ||
          (m.productoCodigo ?? '').toLowerCase().includes(qq) ||
          (m.nota ?? '').toLowerCase().includes(qq) ||
          m.usuarioNombre.toLowerCase().includes(qq),
      );
    }
    return [...out].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [movimientos, tipo, productoFilter, q]);

  const counts = useMemo(
    () => ({
      todos:   movimientos.length,
      ENTRADA: movimientos.filter((m) => m.tipo === 'ENTRADA').length,
      SALIDA:  movimientos.filter((m) => m.tipo === 'SALIDA').length,
      AJUSTE:  movimientos.filter((m) => m.tipo === 'AJUSTE').length,
    }),
    [movimientos],
  );

  const FILTROS: { id: FiltroTipo; label: string }[] = [
    { id: 'todos',   label: 'Todos' },
    { id: 'ENTRADA', label: 'Entradas' },
    { id: 'SALIDA',  label: 'Salidas' },
    { id: 'AJUSTE',  label: 'Ajustes' },
  ];

  return (
    <main className="page" style={{ paddingTop: 80 }}>
      <div className="page-head">
        <div>
          <div className="eyebrow">Trazabilidad</div>
          <h1 className="page-title">Movimientos</h1>
          <p className="page-sub">
            {counts.todos} movimientos registrados · {counts.ENTRADA} entradas · {counts.SALIDA} salidas.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={onRegistrarMovimiento}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Registrar movimiento
          </button>
        </div>
      </div>

      <div className="filterbar">
        <div className="filter-search">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar producto, nota o usuario…"
          />
        </div>

        <div className="seg">
          {FILTROS.map((opt) => (
            <button
              key={opt.id}
              className={`seg-btn${tipo === opt.id ? ' is-active' : ''}`}
              onClick={() => setTipo(opt.id)}
            >
              {opt.label}
              <span className="seg-count">{counts[opt.id as keyof typeof counts] ?? counts.todos}</span>
            </button>
          ))}
        </div>

        {productoFilter && (
          <div className="active-filter">
            Producto: <strong>{productoFilter.nombre}</strong>
            <button onClick={() => setProductoFilter(null)} aria-label="Quitar filtro">
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none">
                <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="card no-pad">
        {isLoading && (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted)' }}>Cargando movimientos…</div>
        )}
        {isError && (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--danger)' }}>Error al cargar movimientos.</div>
        )}
        {!isLoading && !isError && (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 70 }}>#</th>
                    <th>Producto</th>
                    <th style={{ width: 110 }}>Tipo</th>
                    <th style={{ width: 90, textAlign: 'right' }}>Cant.</th>
                    <th style={{ width: 130, textAlign: 'right' }}>Stock</th>
                    <th style={{ width: 160 }}>Usuario</th>
                    <th style={{ width: 160 }}>Nota</th>
                    <th style={{ width: 130, textAlign: 'right' }}>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {list.length === 0 && (
                    <tr>
                      <td colSpan={8} className="empty-state">
                        <div className="empty-title">Sin movimientos</div>
                        <div className="empty-sub">Probá quitar algunos filtros.</div>
                      </td>
                    </tr>
                  )}
                  {list.map((m) => {
                    const isNeg = m.tipo === 'SALIDA' || (m.tipo === 'AJUSTE' && m.cantidad < 0);
                    const cantSign = m.tipo === 'SALIDA' ? '−' : m.tipo === 'ENTRADA' ? '+' : m.cantidad < 0 ? '−' : '+';
                    const cantStr = `${cantSign}${Math.abs(m.cantidad)}`;

                    return (
                      <tr key={m.id}>
                        <td className="td-id">#{m.id}</td>
                        <td>
                          <button
                            className="link-cell"
                            onClick={() => setProductoFilter({ id: m.productoId, nombre: m.productoNombre })}
                          >
                            <span className="td-product-name">{m.productoNombre}</span>
                            {m.productoCodigo && (
                              <span className="td-product-code">{m.productoCodigo}</span>
                            )}
                          </button>
                        </td>
                        <td><TipoChip tipo={m.tipo} /></td>
                        <td className={`td-num ${isNeg ? 'is-neg' : 'is-pos'}`}>{cantStr}</td>
                        <td className="td-num">
                          <div className="td-stock">
                            <span className="stock-prev">{m.stockAnterior}</span>
                            <ArrowRight size={10} strokeWidth={2} style={{ color: 'var(--muted)' }} />
                            <span>{m.stockPosterior}</span>
                          </div>
                        </td>
                        <td>
                          <div className="td-user">
                            <div className="avatar avatar-sm">{initials(m.usuarioNombre)}</div>
                            <span style={{ fontSize: 13 }}>{m.usuarioNombre}</span>
                          </div>
                        </td>
                        <td className="td-muted" style={{ fontSize: 13 }}>{m.nota ?? '—'}</td>
                        <td className="td-num td-muted" style={{ fontSize: 13 }}>{fmtDateTime(m.fecha)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="table-foot">
              <span>{list.length} movimientos</span>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
