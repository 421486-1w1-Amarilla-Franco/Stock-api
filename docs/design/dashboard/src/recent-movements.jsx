const tiempoRelativo = (iso) => {
  const d = new Date(iso);
  const now = new Date(2026, 4, 12, 16, 0);
  const diffMin = Math.round((now - d) / 60000);
  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `hace ${diffH} h`;
  const diffD = Math.round(diffH / 24);
  return `hace ${diffD} d`;
};

const TipoChip = ({ tipo }) => {
  const map = {
    ENTRADA:  { cls: "tipo-in",  label: "Entrada",  arrow: "M12 19V5M5 12l7-7 7 7" },
    SALIDA:   { cls: "tipo-out", label: "Salida",   arrow: "M12 5v14M5 12l7 7 7-7" },
    AJUSTE:   { cls: "tipo-adj", label: "Ajuste",   arrow: "M4 12h16" },
  };
  const m = map[tipo];
  return (
    <span className={`tipo-chip ${m.cls}`}>
      <svg viewBox="0 0 24 24" width="10" height="10" fill="none"><path d={m.arrow} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      {m.label}
    </span>
  );
};

const RecentMovements = ({ movimientos, productoById }) => {
  return (
    <div className="card mov-card">
      <div className="card-head">
        <div>
          <div className="card-title">Últimos movimientos</div>
          <div className="card-sub">Trazabilidad en tiempo real</div>
        </div>
        <div className="card-actions">
          <button className="link-btn">Exportar</button>
          <button className="link-btn">Ver todos →</button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 56 }}>#</th>
              <th>Producto</th>
              <th style={{ width: 110 }}>Tipo</th>
              <th style={{ width: 90, textAlign: "right" }}>Cant.</th>
              <th style={{ width: 130, textAlign: "right" }}>Stock</th>
              <th style={{ width: 160 }}>Usuario</th>
              <th style={{ width: 140 }}>Nota</th>
              <th style={{ width: 100, textAlign: "right" }}>Cuando</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.map(m => {
              const p = productoById(m.producto);
              const cantStr = (m.tipo === "SALIDA" ? "−" : m.tipo === "ENTRADA" ? "+" : (m.cantidad < 0 ? "−" : "+")) + Math.abs(m.cantidad);
              return (
                <tr key={m.id}>
                  <td className="td-id">#{m.id}</td>
                  <td>
                    <div className="td-product">
                      <span className="td-product-name">{p?.nombre}</span>
                      <span className="td-product-code">{p?.codigo}</span>
                    </div>
                  </td>
                  <td><TipoChip tipo={m.tipo}/></td>
                  <td className={`td-num ${m.tipo === "SALIDA" || (m.tipo === "AJUSTE" && m.cantidad < 0) ? "is-neg" : "is-pos"}`}>{cantStr}</td>
                  <td className="td-num td-stock">
                    <span className="stock-prev">{m.stockAnterior}</span>
                    <svg viewBox="0 0 24 24" width="10" height="10" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span className="stock-next">{m.stockPosterior}</span>
                  </td>
                  <td>
                    <div className="td-user">
                      <div className="avatar avatar-sm">{m.usuario.split(" ").map(s => s[0]).join("").slice(0, 2)}</div>
                      <span>{m.usuario}</span>
                    </div>
                  </td>
                  <td className="td-muted">{m.nota}</td>
                  <td className="td-num td-muted">{tiempoRelativo(m.fecha)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

Object.assign(window, { RecentMovements });
