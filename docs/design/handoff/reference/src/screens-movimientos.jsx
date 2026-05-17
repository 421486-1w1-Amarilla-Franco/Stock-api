// =============================================================
// Pantalla Movimientos — historial completo con filtros
// =============================================================

const MovimientosScreen = ({ onOpenMovimiento }) => {
  const stock = useStock();
  const [tipo, setTipo] = React.useState("todos");
  const [q, setQ] = React.useState("");
  const [productoFilter, setProductoFilter] = React.useState(null); // producto id

  const list = React.useMemo(() => {
    let out = stock.movimientos;
    if (tipo !== "todos") out = out.filter(m => m.tipo === tipo);
    if (productoFilter) out = out.filter(m => m.producto === productoFilter);
    if (q.trim()) {
      const qq = q.toLowerCase();
      out = out.filter(m => {
        const p = stock.productoById(m.producto);
        return (
          (p?.nombre || "").toLowerCase().includes(qq) ||
          (p?.codigo || "").toLowerCase().includes(qq) ||
          (m.nota || "").toLowerCase().includes(qq) ||
          (m.usuario || "").toLowerCase().includes(qq)
        );
      });
    }
    return out;
  }, [stock.movimientos, tipo, productoFilter, q, stock.productoById]);

  const counts = {
    todos:   stock.movimientos.length,
    ENTRADA: stock.movimientos.filter(m => m.tipo === "ENTRADA").length,
    SALIDA:  stock.movimientos.filter(m => m.tipo === "SALIDA").length,
    AJUSTE:  stock.movimientos.filter(m => m.tipo === "AJUSTE").length,
  };

  return (
    <main className="page" data-screen-label="04 Movimientos">
      <div className="page-head">
        <div>
          <div className="eyebrow">Trazabilidad</div>
          <h1 className="page-title">Movimientos</h1>
          <p className="page-sub">{counts.todos} movimientos registrados · {counts.ENTRADA} entradas · {counts.SALIDA} salidas.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => onOpenMovimiento?.()}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            Registrar movimiento
          </button>
        </div>
      </div>

      <div className="filterbar">
        <div className="filter-search">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none"><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6"/><path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar producto, nota o usuario…"/>
        </div>
        <div className="seg">
          {[
            { id: "todos", label: "Todos" },
            { id: "ENTRADA", label: "Entradas" },
            { id: "SALIDA", label: "Salidas" },
            { id: "AJUSTE", label: "Ajustes" },
          ].map(opt => (
            <button key={opt.id} className={`seg-btn ${tipo === opt.id ? "is-active" : ""}`} onClick={() => setTipo(opt.id)}>
              {opt.label}
              <span className="seg-count">{counts[opt.id]}</span>
            </button>
          ))}
        </div>
        {productoFilter && (
          <div className="active-filter">
            Producto: <strong>{stock.productoById(productoFilter)?.nombre}</strong>
            <button onClick={() => setProductoFilter(null)} aria-label="Quitar filtro">
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/></svg>
            </button>
          </div>
        )}
      </div>

      <div className="card no-pad">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 70 }}>#</th>
                <th>Producto</th>
                <th style={{ width: 110 }}>Tipo</th>
                <th style={{ width: 90, textAlign: "right" }}>Cant.</th>
                <th style={{ width: 130, textAlign: "right" }}>Stock</th>
                <th style={{ width: 160 }}>Usuario</th>
                <th style={{ width: 160 }}>Nota</th>
                <th style={{ width: 130, textAlign: "right" }}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr><td colSpan="8" className="empty-state">
                  <div className="empty-title">Sin movimientos</div>
                  <div className="empty-sub">Probá quitar algunos filtros.</div>
                </td></tr>
              )}
              {list.map(m => {
                const p = stock.productoById(m.producto);
                const cantStr = (m.tipo === "SALIDA" ? "−" : "+") + Math.abs(m.cantidad);
                return (
                  <tr key={m.id}>
                    <td className="td-id">#{m.id}</td>
                    <td>
                      <button className="link-cell" onClick={() => setProductoFilter(m.producto)}>
                        <span className="td-product-name">{p?.nombre}</span>
                        <span className="td-product-code">{p?.codigo}</span>
                      </button>
                    </td>
                    <td><TipoChip tipo={m.tipo}/></td>
                    <td className={`td-num ${m.tipo === "SALIDA" ? "is-neg" : m.tipo === "ENTRADA" ? "is-pos" : ""}`}>{cantStr}</td>
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
                    <td className="td-muted">{m.nota || "—"}</td>
                    <td className="td-num td-muted">{fmtDateTime(m.fecha)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="table-foot">
          <span>{list.length} movimientos</span>
        </div>
      </div>
    </main>
  );
};

Object.assign(window, { MovimientosScreen });
