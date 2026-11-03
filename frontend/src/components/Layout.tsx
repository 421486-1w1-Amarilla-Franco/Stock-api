import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, ArrowLeftRight, Receipt, Wallet, Users, Truck, BarChart3, ShieldCheck,
  Search, Plus, Sun, Moon, LogOut, Menu, X, Wrench,
} from 'lucide-react';
import { useApp } from '../lib/app-context';
import { initials } from '../lib/format';

interface LayoutProps {
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  onLogout: () => void;
  children: ReactNode;
}

const GROUPS = [
  {
    label: 'Mostrador',
    items: [
      { to: '/', label: 'Inicio', icon: LayoutDashboard },
      { to: '/ventas', label: 'Ventas', icon: Receipt },
      { to: '/caja', label: 'Caja', icon: Wallet },
      { to: '/clientes', label: 'Clientes', icon: Users },
    ],
  },
  {
    label: 'Depósito',
    items: [
      { to: '/productos', label: 'Productos', icon: Package },
      { to: '/movimientos', label: 'Movimientos', icon: ArrowLeftRight },
      { to: '/compras', label: 'Compras', icon: Truck },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { to: '/reportes', label: 'Reportes', icon: BarChart3 },
      { to: '/usuarios', label: 'Usuarios', icon: ShieldCheck, adminOnly: true },
    ],
  },
];

const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);

export default function Layout({ theme, onThemeToggle, onLogout, children }: LayoutProps) {
  const { user, isAdmin, openPos, openPalette } = useApp();
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

  // Cerrar el menú móvil al navegar.
  useEffect(() => { setNavOpen(false); }, [location.pathname]);

  return (
    <div className="shell">
      <a className="skip-link" href="#main">Saltar al contenido</a>

      {/* Barra superior solo en móvil */}
      <header className="mobilebar">
        <button className="icon-btn" onClick={() => setNavOpen(true)} aria-label="Abrir menú">
          <Menu size={18} strokeWidth={1.8} />
        </button>
        <div className="brand-inline">
          <span className="brand-mark" aria-hidden="true"><Wrench size={15} strokeWidth={2} /></span>
          Stock
        </div>
        <button className="icon-btn" onClick={openPalette} aria-label="Buscar">
          <Search size={17} strokeWidth={1.8} />
        </button>
      </header>

      {navOpen && <div className="sidebar-scrim" onClick={() => setNavOpen(false)} aria-hidden="true" />}

      <aside className={`sidebar${navOpen ? ' is-open' : ''}`} aria-label="Navegación principal">
        <div className="sidebar-head">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true"><Wrench size={16} strokeWidth={2} /></span>
            <div className="brand-text">
              <div className="brand-name">Stock</div>
              <div className="brand-sub">Taller · Av. Mitre 2340</div>
            </div>
          </div>
          <button className="icon-btn sidebar-close" onClick={() => setNavOpen(false)} aria-label="Cerrar menú">
            <X size={18} strokeWidth={1.8} />
          </button>
        </div>

        <button className="btn btn-primary btn-sale" onClick={openPos}>
          <Plus size={15} strokeWidth={2.2} aria-hidden="true" />
          Nueva venta
          <kbd>F2</kbd>
        </button>

        <button className="search-trigger" onClick={openPalette}>
          <Search size={14} strokeWidth={1.8} aria-hidden="true" />
          <span>Buscar…</span>
          <kbd>{isMac ? '⌘' : 'Ctrl'} K</kbd>
        </button>

        <nav className="nav">
          {GROUPS.map((g) => {
            const items = g.items.filter((i) => !('adminOnly' in i) || isAdmin);
            if (items.length === 0) return null;
            return (
              <div key={g.label} className="nav-group">
                <div className="nav-label">{g.label}</div>
                {items.map(({ to, label, icon: Icon }) => (
                  <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-item${isActive ? ' is-active' : ''}`}>
                    <Icon size={16} strokeWidth={1.7} aria-hidden="true" />
                    {label}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-foot">
          <div className="avatar" aria-hidden="true">{initials(user.nombre)}</div>
          <div className="user-meta">
            <div className="user-name">{user.nombre.split(' ')[0]}</div>
            <div className="user-role">{isAdmin ? 'Admin' : 'Operador'}</div>
          </div>
          <button
            className="icon-btn"
            onClick={onThemeToggle}
            aria-label={theme === 'light' ? 'Usar tema oscuro' : 'Usar tema claro'}
            title={theme === 'light' ? 'Tema oscuro' : 'Tema claro'}
          >
            {theme === 'light' ? <Moon size={15} strokeWidth={1.6} /> : <Sun size={15} strokeWidth={1.6} />}
          </button>
          <button className="icon-btn icon-btn-danger" onClick={onLogout} aria-label="Cerrar sesión" title="Cerrar sesión">
            <LogOut size={15} strokeWidth={1.6} />
          </button>
        </div>
      </aside>

      <div className="content" id="main">{children}</div>
    </div>
  );
}
