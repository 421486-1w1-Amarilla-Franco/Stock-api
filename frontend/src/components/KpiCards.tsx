import type { ReactNode } from 'react';

export interface Kpi {
  label: string;
  value: string;
  sub?: ReactNode;
  /** Valor actual y del período anterior: muestra la variación real. */
  delta?: { actual: number; anterior: number };
  warn?: boolean;
  onClick?: () => void;
}

/** Variación porcentual contra el período anterior. Sin base (anterior = 0) no inventa porcentajes. */
function Delta({ actual, anterior }: { actual: number; anterior: number }) {
  if (anterior === 0) {
    return actual === 0 ? null : <span className="delta delta-flat">nuevo</span>;
  }
  const pct = ((actual - anterior) / Math.abs(anterior)) * 100;
  if (Math.abs(pct) < 0.05) return <span className="delta delta-flat">= período ant.</span>;
  const up = pct > 0;
  return (
    <span className={`delta ${up ? 'delta-good' : 'delta-bad'}`} title="Contra el período anterior de igual largo">
      {up ? '▲' : '▼'} {Math.abs(pct).toLocaleString('es-AR', { maximumFractionDigits: 1 })}%
    </span>
  );
}

export default function KpiCards({ cards, isLoading }: { cards: Kpi[]; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <div className="kpi-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="kpi-card">
            <div className="skeleton" style={{ height: 14, width: '60%' }} />
            <div className="skeleton" style={{ height: 32, width: '80%', marginTop: 4 }} />
            <div className="skeleton" style={{ height: 12, width: '50%', marginTop: 'auto' }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="kpi-grid">
      {cards.map((c) => {
        const body = (
          <>
            <div className="kpi-head">
              <span className="kpi-label">{c.label}</span>
              {c.delta && <Delta {...c.delta} />}
            </div>
            <div className="kpi-value">{c.value}</div>
            {c.sub && <div className="kpi-foot"><span className="kpi-sub">{c.sub}</span></div>}
          </>
        );
        return c.onClick ? (
          <button key={c.label} type="button" className={`kpi-card kpi-link${c.warn ? ' kpi-warn' : ''}`} onClick={c.onClick}>
            {body}
          </button>
        ) : (
          <div key={c.label} className={`kpi-card${c.warn ? ' kpi-warn' : ''}`}>{body}</div>
        );
      })}
    </div>
  );
}
