const LowStock = ({ productos }) => {
  const items = productos
    .filter(p => p.stockActual <= p.stockMinimo)
    .sort((a, b) => (a.stockActual / a.stockMinimo) - (b.stockActual / b.stockMinimo))
    .slice(0, 6);

  return (
    <div className="card lowstock-card">
      <div className="card-head">
        <div>
          <div className="card-title">Productos bajo stock</div>
          <div className="card-sub">{items.length} items requieren reposición</div>
        </div>
        <button className="link-btn">Ver todos →</button>
      </div>

      <ul className="lowstock-list">
        {items.map(p => {
          const ratio = Math.max(0.04, Math.min(1, p.stockActual / p.stockMinimo));
          const critical = p.stockActual <= p.stockMinimo * 0.34;
          return (
            <li key={p.id} className="lowstock-row">
              <div className="lowstock-main">
                <div className="lowstock-name" title={p.nombre}>{p.nombre}</div>
                <div className="lowstock-meta">
                  <span className="chip chip-ghost">{p.codigo}</span>
                  <span className={`chip ${p.categoria === "LUBRICANTE" ? "chip-lub" : "chip-rep"}`}>
                    {p.categoria === "LUBRICANTE" ? "Lubricante" : "Repuesto"}
                  </span>
                </div>
              </div>
              <div className="lowstock-right">
                <div className="lowstock-counts">
                  <span className={`stock-now ${critical ? "is-critical" : "is-warn"}`}>{p.stockActual}</span>
                  <span className="stock-sep">/ {p.stockMinimo} mín</span>
                </div>
                <div className="stock-bar">
                  <div
                    className={`stock-bar-fill ${critical ? "is-critical" : "is-warn"}`}
                    style={{ width: `${ratio * 100}%` }}
                  />
                </div>
              </div>
              <button className="row-action" aria-label="Reponer">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

Object.assign(window, { LowStock });
