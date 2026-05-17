const SalesChart = ({ data }) => {
  const [hover, setHover] = React.useState(null);
  const w = 720, h = 240, padL = 44, padR = 16, padT = 16, padB = 28;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const max = Math.max(...data);
  const min = 0;
  const range = max - min || 1;

  // build y-axis ticks (4 lines)
  const ticks = 4;
  const tickVals = Array.from({ length: ticks + 1 }, (_, i) => Math.round((max / ticks) * i / 1000) * 1000);

  const pts = data.map((v, i) => {
    const x = padL + (i / (data.length - 1)) * innerW;
    const y = padT + innerH - ((v - min) / range) * innerH;
    return { x, y, v, i };
  });

  const line = pts.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" ");
  const area = `${line} L${pts[pts.length - 1].x},${padT + innerH} L${pts[0].x},${padT + innerH} Z`;

  // x-axis labels: every 5 days, plus "Hoy" at the end
  const today = new Date(2026, 4, 12); // 2026-05-12
  const dateAt = (idx) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (data.length - 1 - idx));
    return d;
  };
  const labelDays = [0, 5, 10, 15, 20, 25, 29];

  const onMove = (e) => {
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const { x } = pt.matrixTransform(ctm.inverse());
    const ratio = (x - padL) / innerW;
    const idx = Math.max(0, Math.min(data.length - 1, Math.round(ratio * (data.length - 1))));
    setHover(idx);
  };

  const total = data.reduce((s, v) => s + v, 0);
  const avg = total / data.length;

  return (
    <div className="card chart-card">
      <div className="card-head">
        <div>
          <div className="card-title">Ventas · últimos 30 días</div>
          <div className="card-sub">
            Total {fmtARS(total)} · promedio diario {fmtARS(Math.round(avg))}
          </div>
        </div>
        <div className="seg">
          <button className="seg-btn">7d</button>
          <button className="seg-btn is-active">30d</button>
          <button className="seg-btn">90d</button>
        </div>
      </div>

      <div className="chart-wrap">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="chart"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          {/* grid + y labels */}
          {tickVals.map((tv, i) => {
            const y = padT + innerH - (tv / range) * innerH;
            return (
              <g key={i}>
                <line x1={padL} x2={w - padR} y1={y} y2={y} stroke="var(--border)" strokeDasharray={i === 0 ? "0" : "2 3"}/>
                <text x={padL - 8} y={y + 3} textAnchor="end" className="chart-axis">
                  {tv >= 1000 ? `${Math.round(tv/1000)}k` : tv}
                </text>
              </g>
            );
          })}

          {/* area + line */}
          <path d={area} fill="url(#chartGrad)"/>
          <defs>
            <linearGradient id="chartGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22"/>
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d={line} stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round"/>

          {/* x labels */}
          {labelDays.map(d => {
            const idx = d;
            const p = pts[idx];
            if (!p) return null;
            const date = dateAt(idx);
            const last = idx === data.length - 1;
            return (
              <text key={d} x={p.x} y={h - 8} textAnchor="middle" className="chart-axis">
                {last ? "Hoy" : `${date.getDate()} ${date.toLocaleDateString("es-AR", { month: "short" }).replace(".", "")}`}
              </text>
            );
          })}

          {/* hover */}
          {hover != null && (
            <g>
              <line x1={pts[hover].x} x2={pts[hover].x} y1={padT} y2={padT + innerH} stroke="var(--border-strong)" strokeDasharray="3 3"/>
              <circle cx={pts[hover].x} cy={pts[hover].y} r="5" fill="var(--bg)" stroke="var(--accent)" strokeWidth="2"/>
            </g>
          )}
        </svg>

        {hover != null && (
          <div
            className="chart-tip"
            style={{
              left: `${(pts[hover].x / w) * 100}%`,
              top: `${(pts[hover].y / h) * 100}%`,
            }}
          >
            <div className="chart-tip-date">
              {dateAt(hover).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })}
            </div>
            <div className="chart-tip-value">{fmtARS(data[hover])}</div>
          </div>
        )}
      </div>
    </div>
  );
};

Object.assign(window, { SalesChart });
