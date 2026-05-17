// Dashboard screen — refactor para leer del store en vivo
const DashboardScreen = ({ onOpenMovimiento }) => {
  const stock = useStock();
  const kpis = useKpis();

  return (
    <main className="page" data-screen-label="01 Dashboard">
      <div className="page-head">
        <div>
          <div className="eyebrow">Resumen</div>
          <h1 className="page-title">Buen día, Mariano.</h1>
          <p className="page-sub">
            {kpis.ventasHoy > 0
              ? <>Llevás <strong>{kpis.ventasHoy} venta{kpis.ventasHoy === 1 ? "" : "s"}</strong> hoy. </>
              : <>Sin ventas registradas hoy todavía. </>}
            Tenés <strong>{kpis.bajoStock} producto{kpis.bajoStock === 1 ? "" : "s"}</strong> bajo stock mínimo.
          </p>
        </div>
        <div className="page-meta">
          <div className="meta-block">
            <div className="meta-label">Período</div>
            <button className="meta-pill">
              Últimos 30 días
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none"><path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
          <div className="meta-divider"/>
          <div className="meta-block">
            <div className="meta-label">Última sincronía</div>
            <div className="meta-value">
              <span className="pulse"/>
              hace 12 s
            </div>
          </div>
        </div>
      </div>

      <KpiCards kpis={kpis} ventasDiarias={stock.ventasDiarias}/>

      <div className="grid-2">
        <SalesChart data={stock.ventasDiarias}/>
        <LowStock
          productos={stock.productos.filter(p => p.activo)}
          onAddStock={(id) => onOpenMovimiento?.(id, "ENTRADA")}
        />
      </div>

      <div className="grid-2 grid-2-alt">
        <RecentMovements
          movimientos={stock.movimientos.slice(0, 10)}
          productoById={stock.productoById}
        />
        <TopProducts productos={stock.productos}/>
      </div>

      <footer className="page-foot">
        <span>Stock API · v0.1 · taller@avmitre.com.ar</span>
        <span>Sincroniza cada 30 s · SQL Server stock_db</span>
      </footer>
    </main>
  );
};

Object.assign(window, { DashboardScreen });
