// Placeholder elegante para pantallas no implementadas todavía
const PlaceholderScreen = ({ title, eyebrow, description, items, screenLabel }) => (
  <main className="page" data-screen-label={screenLabel}>
    <div className="page-head">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="page-title">{title}</h1>
        <p className="page-sub">{description}</p>
      </div>
    </div>

    <div className="placeholder-card">
      <div className="placeholder-icon">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M3 12h4l3-7 4 14 3-7h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <div className="placeholder-title">Próximamente</div>
      <div className="placeholder-sub">Esta sección va a incluir:</div>
      <ul className="placeholder-list">
        {items.map((it, i) => (
          <li key={i}>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none"><path d="m5 12 4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {it}
          </li>
        ))}
      </ul>
    </div>
  </main>
);

const ReportesScreen = () => (
  <PlaceholderScreen
    screenLabel="05 Reportes"
    eyebrow="Análisis"
    title="Reportes"
    description="Reportes financieros y operativos con rangos de fecha personalizados."
    items={[
      "Reporte de ventas por rango de fechas (`/api/reportes/ventas`)",
      "Valor de inventario actual y proyección (`/api/reportes/stock`)",
      "Ranking de productos más vendidos por unidades e ingresos",
      "Comparativa mes a mes y export a CSV/PDF",
    ]}
  />
);

const UsuariosScreen = () => (
  <PlaceholderScreen
    screenLabel="06 Usuarios"
    eyebrow="Administración"
    title="Usuarios"
    description="Gestión de cuentas — sólo accesible para rol ADMIN."
    items={[
      "Listado de usuarios activos con su rol (ADMIN / OPERADOR)",
      "Crear, editar y deshabilitar cuentas",
      "Reseteo de contraseña y auditoría de accesos",
      "Permisos granulares por endpoint",
    ]}
  />
);

Object.assign(window, { PlaceholderScreen, ReportesScreen, UsuariosScreen });
