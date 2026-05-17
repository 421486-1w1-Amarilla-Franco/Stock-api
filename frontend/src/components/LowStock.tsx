import { Plus } from 'lucide-react';
import type { ProductoResponse } from '../types/api';

interface LowStockProps {
  productos: ProductoResponse[];
  isLoading?: boolean;
  onAddStock?: (productoId: number) => void;
}

export default function LowStock({ productos, isLoading, onAddStock }: LowStockProps) {
  const items = [...productos]
    .filter((p) => p.stockActual <= p.stockMinimo)
    .sort((a, b) => a.stockActual / a.stockMinimo - b.stockActual / b.stockMinimo)
    .slice(0, 6);

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-head">
          <div>
            <div className="skeleton" style={{ height: 16, width: 160 }} />
            <div className="skeleton" style={{ height: 12, width: 120, marginTop: 6 }} />
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, paddingTop: 11, borderTop: i > 0 ? '1px solid var(--border)' : undefined }}>
            <div className="skeleton" style={{ flex: 1, height: 40 }} />
            <div className="skeleton" style={{ width: 80, height: 40 }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="card-title">Productos bajo stock</div>
          <div className="card-sub">{items.length} items requieren reposición</div>
        </div>
        <button className="link-btn">Ver todos →</button>
      </div>

      <ul className="lowstock-list">
        {items.map((p) => {
          const ratio = Math.max(0.04, Math.min(1, p.stockActual / p.stockMinimo));
          const critical = p.stockActual <= p.stockMinimo * 0.34;
          return (
            <li key={p.id} className="lowstock-row">
              <div className="lowstock-main">
                <div className="lowstock-name" title={p.nombre}>{p.nombre}</div>
                <div className="lowstock-meta">
                  <span className="chip chip-ghost">{p.codigo}</span>
                  <span className={`chip ${p.categoria === 'LUBRICANTE' ? 'chip-lub' : 'chip-rep'}`}>
                    {p.categoria === 'LUBRICANTE' ? 'Lubricante' : 'Repuesto'}
                  </span>
                </div>
              </div>
              <div className="lowstock-right">
                <div className="lowstock-counts">
                  <span className={`stock-now ${critical ? 'is-critical' : 'is-warn'}`}>{p.stockActual}</span>
                  <span className="stock-sep">/ {p.stockMinimo} mín</span>
                </div>
                <div className="stock-bar">
                  <div
                    className={`stock-bar-fill ${critical ? 'is-critical' : 'is-warn'}`}
                    style={{ width: `${ratio * 100}%` }}
                  />
                </div>
              </div>
              <button className="row-action" aria-label="Reponer" onClick={() => onAddStock?.(p.id)}>
                <Plus size={14} strokeWidth={2} />
              </button>
            </li>
          );
        })}

        {items.length === 0 && (
          <li style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            Sin productos bajo stock mínimo
          </li>
        )}
      </ul>
    </div>
  );
}
