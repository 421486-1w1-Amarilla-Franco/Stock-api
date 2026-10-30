import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { MovimientoResponse } from '../types/api';
import { tiempoRelativo, initials } from '../lib/format';
import TipoChip from './TipoChip';

interface RecentMovementsProps {
  movimientos: MovimientoResponse[];
  isLoading?: boolean;
  onVerTodos?: () => void;
}

export default function RecentMovements({ movimientos, isLoading, onVerTodos }: RecentMovementsProps) {
  const items = [...movimientos]
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 10);

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-head">
          <div>
            <div className="skeleton" style={{ height: 16, width: 160 }} />
            <div className="skeleton" style={{ height: 12, width: 200, marginTop: 6 }} />
          </div>
        </div>
        <div className="skeleton" style={{ height: 280 }} />
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="card-title">Últimos movimientos</div>
          <div className="card-sub">Los 10 más recientes</div>
        </div>
        <button className="link-btn" onClick={onVerTodos}>Ver todos →</button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col" style={{ width: 56 }}>#</th>
              <th scope="col">Producto</th>
              <th scope="col" style={{ width: 110 }}>Tipo</th>
              <th scope="col" style={{ width: 90, textAlign: 'right' }}>Cant.</th>
              <th scope="col" style={{ width: 130, textAlign: 'right' }}>Stock</th>
              <th scope="col" style={{ width: 160 }}>Usuario</th>
              <th scope="col" style={{ width: 140 }}>Nota</th>
              <th scope="col" style={{ width: 100, textAlign: 'right' }}>Cuándo</th>
            </tr>
          </thead>
          <tbody>
            {items.map((m) => {
              const isNeg = m.tipo === 'SALIDA' || (m.tipo === 'AJUSTE' && m.cantidad < 0);
              const cantSign = m.tipo === 'SALIDA' ? '−' : m.tipo === 'ENTRADA' ? '+' : (m.cantidad < 0 ? '−' : '+');
              const cantStr = `${cantSign}${Math.abs(m.cantidad)}`;
              const avatarInitials = initials(m.usuarioNombre);

              return (
                <tr key={m.id}>
                  <td className="td-id">#{m.id}</td>
                  <td>
                    <div className="td-product">
                      <Link className="td-product-name link" to={`/productos/${m.productoId}`}>{m.productoNombre}</Link>
                      {m.productoCodigo && (
                        <span className="td-product-code">{m.productoCodigo}</span>
                      )}
                    </div>
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
                      <div className="avatar avatar-sm">{avatarInitials}</div>
                      <span>{m.usuarioNombre}</span>
                    </div>
                  </td>
                  <td className="td-muted">{m.nota ?? '—'}</td>
                  <td className="td-num td-muted">{tiempoRelativo(m.fecha)}</td>
                </tr>
              );
            })}

            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="card-empty">
                  Todavía no hay movimientos. Aparecen al vender o ajustar stock.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
