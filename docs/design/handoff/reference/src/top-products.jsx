const TopProducts = ({ productos }) => {
  // fake "más vendidos del mes" derived from data
  const items = [
    { id: 4,  vendidos: 47, ingresos: 1351250 },
    { id: 1,  vendidos: 38, ingresos: 321100 },
    { id: 12, vendidos: 36, ingresos: 244800 },
    { id: 2,  vendidos: 29, ingresos: 121800 },
    { id: 6,  vendidos: 22, ingresos: 312400 },
  ].map(it => ({ ...it, producto: productos.find(p => p.id === it.id) }));

  const max = Math.max(...items.map(i => i.vendidos));

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
          <li key={it.id} className="top-row">
            <div className="top-rank">{String(i + 1).padStart(2, "0")}</div>
            <div className="top-main">
              <div className="top-name">{it.producto.nombre}</div>
              <div className="top-bar-wrap">
                <div className="top-bar" style={{ width: `${(it.vendidos / max) * 100}%` }}/>
              </div>
            </div>
            <div className="top-right">
              <div className="top-units">{it.vendidos} u</div>
              <div className="top-rev">{fmtARS(it.ingresos)}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

Object.assign(window, { TopProducts });
