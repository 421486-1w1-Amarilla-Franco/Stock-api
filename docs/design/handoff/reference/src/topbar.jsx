const Topbar = ({ activeTab, setActiveTab, onNuevaVenta }) => {
  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "productos", label: "Productos" },
    { id: "movimientos", label: "Movimientos" },
    { id: "ventas", label: "Ventas" },
    { id: "reportes", label: "Reportes" },
    { id: "usuarios", label: "Usuarios" },
  ];

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
              <path d="M4 7l8-4 8 4v10l-8 4-8-4V7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
              <path d="M4 7l8 4 8-4M12 11v10" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="brand-text">
            <div className="brand-name">Stock</div>
            <div className="brand-sub">Taller · Av. Mitre 2340</div>
          </div>
        </div>

        <nav className="tabs" role="tablist">
          {tabs.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={activeTab === t.id}
              className={`tab ${activeTab === t.id ? "is-active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="topbar-actions">
          <div className="search">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none"><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6"/><path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
            <input placeholder="Buscar producto, código, venta…"/>
            <kbd>⌘K</kbd>
          </div>
          <button className="btn btn-primary" onClick={onNuevaVenta}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            Nueva venta
          </button>
          <button className="icon-btn" aria-label="Notificaciones">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none"><path d="M6 8a6 6 0 0 1 12 0v4l1.5 3h-15L6 12V8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M10 18a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <span className="dot"/>
          </button>
          <div className="user-chip">
            <div className="avatar">MA</div>
            <div className="user-meta">
              <div className="user-name">M. Álvarez</div>
              <div className="user-role">ADMIN</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

Object.assign(window, { Topbar });
