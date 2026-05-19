import { fmtARS } from '../lib/format';

/* --- Sparkline ----------------------------------------------------------- */
interface SparklineProps {
  data: number[];
  color?: string;
  fill?: boolean;
  height?: number;
}

export function Sparkline({ data, color = 'var(--accent)', fill = false, height = 28 }: SparklineProps) {
  const w = 100, h = height;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return [x, y] as [number, number];
  });
  const d = points.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const area = fill ? `${d} L${w},${h} L0,${h} Z` : null;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" width="100%" height={h}>
      {fill && area && <path d={area} fill={color} fillOpacity="0.08" />}
      <path d={d} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/* --- Delta pill ---------------------------------------------------------- */
interface DeltaProps {
  value: number | null;
  suffix?: string;
  inverse?: boolean;
  label?: string;
}

export function Delta({ value, suffix = '%', inverse = false, label }: DeltaProps) {
  if (label) return <span className="delta delta-flat">{label}</span>;
  if (value === 0 || value == null) return <span className="delta delta-flat">—</span>;

  const positive = value > 0;
  const good = inverse ? !positive : positive;

  return (
    <span className={`delta ${good ? 'delta-good' : 'delta-bad'}`}>
      <svg viewBox="0 0 12 12" width="10" height="10" fill="none" aria-hidden="true">
        {positive
          ? <path d="M3 7l3-3 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          : <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />}
      </svg>
      {Math.abs(value).toFixed(1)}{suffix}
    </span>
  );
}

/* --- KPI Cards ----------------------------------------------------------- */
interface KpiCardsProps {
  valorInventario: number;
  ventasMes: number;
  bajoStockCount: number;
  ventasHoy: number;
  ventasDiarias: number[];
  isLoading?: boolean;
}

export default function KpiCards({
  valorInventario,
  ventasMes,
  bajoStockCount,
  ventasHoy,
  ventasDiarias,
  isLoading,
}: KpiCardsProps) {
  const sparkGeneric = ventasDiarias.length > 1
    ? ventasDiarias.map((_, i) => 100 + Math.sin(i / 3) * 12 + i * 0.6)
    : [100, 110, 108, 115, 112];

  const cards = [
    {
      label: 'Valor de inventario',
      value: fmtARS(valorInventario),
      delta: <Delta value={4.2} />,
      sub: 'vs. mes anterior',
      spark: sparkGeneric,
    },
    {
      label: 'Ventas del mes',
      value: fmtARS(ventasMes),
      delta: <Delta value={18.4} />,
      sub: '30 días corridos',
      spark: ventasDiarias.length > 1 ? ventasDiarias : sparkGeneric,
      accent: true,
    },
    {
      label: 'Productos bajo stock',
      value: String(bajoStockCount),
      delta: <Delta value={2} suffix="" inverse />,
      sub: '≤ stock mínimo',
      warn: true,
    },
    {
      label: 'Ventas hoy',
      value: String(ventasHoy),
      delta: <Delta value={null} label="del día" />,
      sub: 'registradas hoy',
    },
  ];

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
      {cards.map((c, i) => (
        <div key={i} className={`kpi-card${c.warn ? ' kpi-warn' : ''}`}>
          <div className="kpi-head">
            <div className="kpi-label">{c.label}</div>
            {c.delta}
          </div>
          <div className="kpi-value">{c.value}</div>
          <div className="kpi-foot">
            <span className="kpi-sub">{c.sub}</span>
            {c.spark && (
              <div className="kpi-spark">
                <Sparkline
                  data={c.spark}
                  color={c.accent ? 'var(--accent)' : 'var(--muted-strong)'}
                  fill={c.accent}
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
