import { Sun, Moon, Package, Search, Plus, Bell, ChevronDown } from 'lucide-react';
import type { AuthUser } from '../types/api';
import { initials } from '../lib/format';

interface TopbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  user: AuthUser | null;
  onLogout: () => void;
  onNuevaVenta: () => void;
}

const ALL_TABS = [
  { id: 'dashboard',   label: 'Dashboard',   adminOnly: false },
  { id: 'productos',   label: 'Productos',   adminOnly: false },
  { id: 'movimientos', label: 'Movimientos', adminOnly: false },
  { id: 'ventas',      label: 'Ventas',      adminOnly: false },
  { id: 'reportes',    label: 'Reportes',    adminOnly: false },
  { id: 'usuarios',    label: 'Usuarios',    adminOnly: true  },
];

export default function Topbar({ activeTab, onTabChange, theme, onThemeToggle, user, onLogout, onNuevaVenta }: TopbarProps) {
  const isAdmin = user?.rol === 'ADMIN';
  const TABS = ALL_TABS.filter((t) => !t.adminOnly || isAdmin);
  return (
    <header className="topbar">
      <div className="topbar-inner">
        {/* Brand */}
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <Package size={18} strokeWidth={1.6} />
          </div>
          <div className="brand-text">
            <div className="brand-name">Stock</div>
            <div className="brand-sub">Taller · Av. Mitre 2340</div>
          </div>
        </div>

        {/* Tabs */}
        <nav className="tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={activeTab === t.id}
              className={`tab${activeTab === t.id ? ' is-active' : ''}`}
              onClick={() => onTabChange(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="topbar-actions">
          <div className="search">
            <Search size={14} strokeWidth={1.6} />
            <input placeholder="Buscar producto, código, venta…" readOnly onClick={() => {}} />
            <kbd>⌘K</kbd>
          </div>

          <button className="btn btn-primary" type="button" onClick={onNuevaVenta}>
            <Plus size={14} strokeWidth={2} />
            Nueva venta
          </button>

          <button className="icon-btn" aria-label="Notificaciones" type="button">
            <Bell size={16} strokeWidth={1.5} />
            <span className="dot" />
          </button>

          <button className="theme-btn" aria-label="Cambiar tema" type="button" onClick={onThemeToggle}>
            {theme === 'light' ? <Moon size={15} strokeWidth={1.5} /> : <Sun size={15} strokeWidth={1.5} />}
          </button>

          {user && (
            <button className="user-chip" type="button" onClick={onLogout} aria-label="Cerrar sesión">
              <div className="avatar" aria-hidden="true">{initials(user.nombre)}</div>
              <div className="user-meta">
                <div className="user-name">{user.nombre.split(' ').slice(0, 2).map((n, i) => i === 0 ? n[0] + '.' : n).join(' ')}</div>
                <div className="user-role">{user.rol}</div>
              </div>
              <ChevronDown size={12} style={{ color: 'var(--muted)', marginRight: 4 }} strokeWidth={2} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
