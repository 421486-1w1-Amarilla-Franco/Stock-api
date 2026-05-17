const fmtARS = (n) => "$" + n.toLocaleString("es-AR", { maximumFractionDigits: 0 });
const fmtNum = (n) => n.toLocaleString("es-AR");

const Delta = ({ value, suffix = "%", inverse = false }) => {
  if (value === 0 || value == null) {
    return <span className="delta delta-flat">—</span>;
  }
  const positive = value > 0;
  const good = inverse ? !positive : positive;
  return (
    <span className={`delta ${good ? "delta-good" : "delta-bad"}`}>
      <svg viewBox="0 0 12 12" width="10" height="10" fill="none" aria-hidden="true">
        {positive
          ? <path d="M3 7l3-3 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          : <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>}
      </svg>
      {Math.abs(value).toFixed(1)}{suffix}
    </span>
  );
};

const Sparkline = ({ data, color = "var(--accent)", height = 28, fill = false }) => {
  const w = 100, h = height;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return [x, y];
  });
  const d = points.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  const area = fill ? `${d} L${w},${h} L0,${h} Z` : null;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="spark" width="100%" height={h}>
      {fill && <path d={area} fill={color} fillOpacity="0.08"/>}
      <path d={d} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
    </svg>
  );
};

const KpiCards = ({ kpis, ventasDiarias }) => {
  const cards = [
    {
      label: "Valor de inventario",
      value: fmtARS(kpis.valorInventario),
      delta: <Delta value={kpis.valorInventarioDelta} />,
      sub: "vs. mes anterior",
      spark: ventasDiarias.map((v, i) => 100 + Math.sin(i / 3) * 12 + i * 0.6),
    },
    {
      label: "Ventas del mes",
      value: fmtARS(kpis.ventasMes),
      delta: <Delta value={kpis.ventasMesDelta} />,
      sub: "30 días corridos",
      spark: ventasDiarias,
      accent: true,
    },
    {
      label: "Productos bajo stock",
      value: kpis.bajoStock,
      delta: <Delta value={kpis.bajoStockDelta} suffix="" inverse />,
      sub: "≤ stock mínimo",
      warn: true,
    },
    {
      label: "Ventas pendientes",
      value: kpis.transaccionesPendientes,
      delta: <span className="delta delta-flat">sin cambios</span>,
      sub: "a completar",
    },
  ];

  return (
    <div className="kpi-grid">
      {cards.map((c, i) => (
        <div key={i} className={`kpi-card ${c.warn ? "kpi-warn" : ""}`}>
          <div className="kpi-head">
            <div className="kpi-label">{c.label}</div>
            {c.delta}
          </div>
          <div className="kpi-value">{c.value}</div>
          <div className="kpi-foot">
            <span className="kpi-sub">{c.sub}</span>
            {c.spark && (
              <div className="kpi-spark">
                <Sparkline data={c.spark} color={c.accent ? "var(--accent)" : "var(--muted-strong)"} fill={c.accent}/>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

Object.assign(window, { KpiCards, Sparkline, Delta, fmtARS, fmtNum });
