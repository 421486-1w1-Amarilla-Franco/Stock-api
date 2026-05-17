import { useEffect, type ReactNode } from 'react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  width?: number;
  footer?: ReactNode;
  children: ReactNode;
}

export default function Drawer({ open, onClose, title, subtitle, width = 520, footer, children }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer-panel" style={{ width }} onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-label={title}>
        <div className="drawer-header">
          <div>
            <div className="drawer-title">{title}</div>
            {subtitle && <div className="drawer-subtitle">{subtitle}</div>}
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="Cerrar">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
              <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer && <div className="drawer-footer">{footer}</div>}
      </div>
    </div>
  );
}
