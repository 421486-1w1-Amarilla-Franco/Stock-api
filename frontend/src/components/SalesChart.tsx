import { useState } from 'react';
import { fmtARS } from '../lib/format';

interface SalesChartProps {
  data: number[];
  isLoading?: boolean;
  /** Último día de `data`. Por defecto hoy. */
  hasta?: Date;
  /** Si se pasa, el gráfico muestra todo `data` con este título y sin selector de rango. */
  title?: string;
}

type Range = '7d' | '30d';

export default function SalesChart({ data, isLoading, hasta, title }: SalesChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const [range, setRange] = useState<Range>('30d');

  const displayData = title ? data : range === '7d' ? data.slice(-7) : data.slice(-30);

  const w = 720, h = 240;
  const padL = 44, padR = 16, padT = 16, padB = 28;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const max = displayData.length > 0 ? Math.max(...displayData) : 1;
  const range_ = max || 1;
  const ticks = 4;
  const tickVals = Array.from({ length: ticks + 1 }, (_, i) =>
    Math.round((max / ticks) * i / 1000) * 1000
  );

  const pts = displayData.map((v, i) => ({
    x: padL + (i / Math.max(displayData.length - 1, 1)) * innerW,
    y: padT + innerH - (v / range_) * innerH,
    v, i,
  }));

  const line = pts.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
  const area = pts.length > 1
    ? `${line} L${pts[pts.length - 1].x},${padT + innerH} L${pts[0].x},${padT + innerH} Z`
    : '';

  const end = hasta ?? new Date();
  const endIsToday = end.toDateString() === new Date().toDateString();
  const dateAt = (idx: number) => {
    const d = new Date(end);
    d.setDate(d.getDate() - (displayData.length - 1 - idx));
    return d;
  };

  const n = displayData.length;
  const step = Math.max(1, Math.ceil((n - 1) / 6));
  const labelIdxs = n <= 7
    ? [0, Math.floor(n / 2), n - 1]
    : Array.from({ length: n }, (_, i) => i).filter((i) => i % step === 0 && n - 1 - i >= step / 2).concat(n - 1);

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * w;
    const ratio = (svgX - padL) / innerW;
    const idx = Math.max(0, Math.min(displayData.length - 1, Math.round(ratio * (displayData.length - 1))));
    setHover(idx);
  };

  const total = displayData.reduce((s, v) => s + v, 0);
  const avg = displayData.length > 0 ? total / displayData.length : 0;

  if (isLoading) {
    return (
      <div className="card chart-card">
        <div className="card-head">
          <div>
            <div className="skeleton" style={{ height: 16, width: 180 }} />
            <div className="skeleton" style={{ height: 12, width: 240, marginTop: 6 }} />
          </div>
        </div>
        <div className="skeleton" style={{ height: 240 }} />
      </div>
    );
  }

  return (
    <div className="card chart-card">
      <div className="card-head">
        <div>
          <div className="card-title">{title ?? `Ventas · últimos ${range === '7d' ? '7' : '30'} días`}</div>
          <div className="card-sub">
            Total {fmtARS(total)} · promedio diario {fmtARS(Math.round(avg))}
          </div>
        </div>
        {!title && (
          <div className="seg" role="group" aria-label="Rango del gráfico">
            {(['7d', '30d'] as Range[]).map((r) => (
              <button
                key={r}
                className={`seg-btn${range === r ? ' is-active' : ''}`}
                aria-pressed={range === r}
                onClick={() => setRange(r)}
              >
                {r === '7d' ? '7 días' : '30 días'}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="chart-wrap">
        {total === 0 && <div className="chart-empty">Sin ventas en este período</div>}
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="chart"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          {/* Grid + y-axis labels */}
          {tickVals.map((tv, i) => {
            const y = padT + innerH - (tv / range_) * innerH;
            return (
              <g key={i}>
                <line
                  x1={padL} x2={w - padR}
                  y1={y} y2={y}
                  stroke="var(--border)"
                  strokeDasharray={i === 0 ? '0' : '2 3'}
                />
                <text x={padL - 8} y={y + 3} textAnchor="end" className="chart-axis">
                  {tv >= 1000 ? `${Math.round(tv / 1000)}k` : tv}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <defs>
            <linearGradient id="chartGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {area && <path d={area} fill="url(#chartGrad)" />}

          {/* Line */}
          {line && (
            <path d={line} stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round" />
          )}

          {/* X-axis labels */}
          {labelIdxs.map((idx) => {
            const p = pts[idx];
            if (!p) return null;
            const date = dateAt(idx);
            const isLast = idx === displayData.length - 1;
            return (
              <text key={idx} x={p.x} y={h - 8} textAnchor="middle" className="chart-axis">
                {isLast && endIsToday
                  ? 'Hoy'
                  : `${date.getDate()} ${date.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '')}`}
              </text>
            );
          })}

          {/* Hover crosshair */}
          {hover != null && pts[hover] && (
            <g>
              <line
                x1={pts[hover].x} x2={pts[hover].x}
                y1={padT} y2={padT + innerH}
                stroke="var(--border-strong)" strokeDasharray="3 3"
              />
              <circle
                cx={pts[hover].x} cy={pts[hover].y}
                r="5"
                fill="var(--bg)" stroke="var(--accent)" strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Tooltip */}
        {hover != null && pts[hover] && (
          <div
            className="chart-tip"
            style={{
              left: `${(pts[hover].x / w) * 100}%`,
              top: `${(pts[hover].y / h) * 100}%`,
            }}
          >
            <div className="chart-tip-date">
              {dateAt(hover).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>
            <div className="chart-tip-value">{fmtARS(displayData[hover])}</div>
          </div>
        )}
      </div>
    </div>
  );
}
