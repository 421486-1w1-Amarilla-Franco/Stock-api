import type { ProductoMasVendidoResponse } from '../types/api';
import { fmtARS } from '../lib/format';

interface TopProductsProps {
  productos: ProductoMasVendidoResponse[];
  isLoading?: boolean;
}

export default function TopProducts({ productos, isLoading }: TopProductsProps) {
  const items = productos.slice(0, 5);
  const max = items.length > 0 ? Math.max(...items.map((p) => p.cantidadVendida)) : 1;

  if (isLoading) {
    return (
      <div className="card top-card">
        <div className="card-head">
          <div>
            <div className="skeleton" style={{ height: 16, width: 160 }} />
            <div className="skeleton" style={{ height: 12, width: 140, marginTop: 6 }} />
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div className="skeleton" style={{ width: 22, height: 14 }} />
            <div className="skeleton" style={{ flex: 1, height: 36 }} />
            <div className="skeleton" style={{ width: 48, height: 36 }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="card top-card">
      <div className="card-head">
        <div>
          <div className="card-title">Más vendidos del mes</div>
          <div className="card-sub">Ordenado por unidades</div>
        </div>
      </div>

      <ul className="top-list">
        {items.map((it, i) => (
          <li key={i} className="top-row">
            <div className="top-rank">{String(i + 1).padStart(2, '0')}</div>
            <div className="top-main">
              <div className="top-name" title={it.nombre}>{it.nombre}</div>
              <div className="top-bar-wrap">
                <div
                  className="top-bar"
                  style={{ width: `${(it.cantidadVendida / max) * 100}%` }}
                />
              </div>
            </div>
            <div className="top-right">
              <div className="top-units">{it.cantidadVendida} u</div>
              {it.ingresos > 0 && (
                <div className="top-rev">{fmtARS(it.ingresos)}</div>
              )}
            </div>
          </li>
        ))}

        {items.length === 0 && (
          <li style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: '24px 0' }}>
            Sin datos de ventas en el período
          </li>
        )}
      </ul>
    </div>
  );
}
