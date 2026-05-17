const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light"
}/*EDITMODE-END*/;

const App = () => {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [activeTab, setActiveTab] = React.useState("dashboard");
  const data = window.STOCK_DATA;

  // Apply theme
  React.useEffect(() => {
    document.documentElement.dataset.theme = tweaks.theme || "light";
  }, [tweaks.theme]);

  return (
    <>
      <Topbar activeTab={activeTab} setActiveTab={setActiveTab}/>

      <main className="page" data-screen-label="01 Dashboard">
        <div className="page-head">
          <div>
            <div className="eyebrow">Resumen</div>
            <h1 className="page-title">Buen día, Mariano.</h1>
            <p className="page-sub">Tenés <strong>3 ventas pendientes</strong> de completar y <strong>7 productos</strong> bajo stock mínimo.</p>
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

        <KpiCards kpis={data.kpis} ventasDiarias={data.ventasDiarias}/>

        <div className="grid-2">
          <SalesChart data={data.ventasDiarias}/>
          <LowStock productos={data.productos}/>
        </div>

        <div className="grid-2 grid-2-alt">
          <RecentMovements movimientos={data.movimientos} productoById={data.productoById}/>
          <TopProducts productos={data.productos}/>
        </div>

        <footer className="page-foot">
          <span>Stock API · v0.1 · taller@avmitre.com.ar</span>
          <span>Sincroniza cada 30 s · SQL Server stock_db</span>
        </footer>
      </main>

      <TweaksPanel title="Tweaks">
        <TweakSection title="Tema">
          <TweakRadio
            value={tweaks.theme}
            options={[
              { value: "light", label: "Light" },
              { value: "dark",  label: "Dark"  },
            ]}
            onChange={(v) => setTweak("theme", v)}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App/>);
