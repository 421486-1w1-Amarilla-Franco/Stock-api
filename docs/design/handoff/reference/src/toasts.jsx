// Toasts container — escucha el store y renderiza notificaciones flotantes
const Toasts = () => {
  const { toasts, dismissToast } = useStock();

  React.useEffect(() => {
    const timers = toasts.map(t => setTimeout(() => dismissToast(t.id), 4200));
    return () => timers.forEach(clearTimeout);
  }, [toasts, dismissToast]);

  return (
    <div className="toasts" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.kind || "info"}`} role="status">
          <div className="toast-icon" aria-hidden="true">
            {t.kind === "success" && (
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none"><path d="m5 12 4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            )}
            {t.kind === "error" && (
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none"><path d="M12 8v5M12 17v.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/></svg>
            )}
            {(!t.kind || t.kind === "info") && (
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 8v.01M12 11v5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/></svg>
            )}
          </div>
          <div className="toast-body">
            <div className="toast-title">{t.title}</div>
            {t.description && <div className="toast-desc">{t.description}</div>}
          </div>
          <button className="toast-close" onClick={() => dismissToast(t.id)} aria-label="Cerrar">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>
      ))}
    </div>
  );
};

Object.assign(window, { Toasts });
