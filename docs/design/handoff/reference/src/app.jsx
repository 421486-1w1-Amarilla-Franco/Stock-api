const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light"
}/*EDITMODE-END*/;

const Shell = () => {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [activeTab, setActiveTab] = React.useState("dashboard");
  const [posOpen, setPosOpen] = React.useState(false);
  const [movOpen, setMovOpen] = React.useState({ open: false, productoId: null, tipo: "ENTRADA" });

  const openMovimiento = (productoId = null, tipo = "ENTRADA") =>
    setMovOpen({ open: true, productoId, tipo });
  const closeMovimiento = () => setMovOpen({ open: false, productoId: null, tipo: "ENTRADA" });

  React.useEffect(() => {
    document.documentElement.dataset.theme = tweaks.theme || "light";
  }, [tweaks.theme]);

  const screen = (() => {
    switch (activeTab) {
      case "dashboard":   return <DashboardScreen onOpenMovimiento={openMovimiento}/>;
      case "productos":   return <ProductosScreen onOpenMovimiento={openMovimiento}/>;
      case "movimientos": return <MovimientosScreen onOpenMovimiento={openMovimiento}/>;
      case "ventas":      return <VentasScreen onNuevaVenta={() => setPosOpen(true)}/>;
      case "reportes":    return <ReportesScreen/>;
      case "usuarios":    return <UsuariosScreen/>;
      default:            return <DashboardScreen onOpenMovimiento={openMovimiento}/>;
    }
  })();

  return (
    <>
      <Topbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNuevaVenta={() => setPosOpen(true)}
      />

      <div key={activeTab} className="screen-fade">
        {screen}
      </div>

      <NuevaVentaOverlay open={posOpen} onClose={() => setPosOpen(false)}/>
      <MovimientoDrawer
        open={movOpen.open}
        prefillProductoId={movOpen.productoId}
        prefillTipo={movOpen.tipo}
        onClose={closeMovimiento}
      />
      <Toasts/>

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

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("App error:", error, info); }
  reset = () => this.setState({ error: null });
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="error-fallback">
        <div className="error-card">
          <div className="error-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M12 9v4M12 17v.01M10.3 4.86 2.7 18a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 4.86a2 2 0 0 0-3.4 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div className="error-title">Algo salió mal en esta pantalla</div>
          <div className="error-desc">{String(this.state.error?.message || this.state.error)}</div>
          <button className="btn btn-primary" onClick={this.reset}>Volver a intentar</button>
        </div>
      </div>
    );
  }
}

const App = () => (
  <ErrorBoundary>
    <StockProvider>
      <Shell/>
    </StockProvider>
  </ErrorBoundary>
);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App/>);
