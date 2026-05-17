import { useEffect } from 'react';

export interface ToastData {
  id: number;
  kind: 'success' | 'error' | 'info';
  title: string;
}

interface ToastProps {
  toast: ToastData | null;
  onDismiss: () => void;
}

const ICONS = {
  success: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
      <path d="m5 12 4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
      <path d="M12 9v4M12 17v.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 11v5M12 8v.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  ),
};

export default function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 4200);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div className="toast-container" onClick={onDismiss} aria-live="polite">
      <div className={`toast toast-${toast.kind}`} role="status">
        <div className={`toast-icon toast-icon-${toast.kind}`}>
          {ICONS[toast.kind]}
        </div>
        <div className="toast-title">{toast.title}</div>
        <button className="toast-close" aria-label="Cerrar notificación">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none">
            <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
