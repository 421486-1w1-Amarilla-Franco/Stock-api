import { useState, useEffect, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import Productos from './pages/Productos';
import Ventas from './pages/Ventas';
import Movimientos from './pages/Movimientos';
import NuevaVentaOverlay from './components/NuevaVentaOverlay';
import MovimientoDrawer from './components/MovimientoDrawer';
import Toast, { type ToastData } from './components/Toast';
import Login from './pages/Login';
import ErrorBoundary from './components/ErrorBoundary';
import Reportes from './pages/Reportes';
import Usuarios from './pages/Usuarios';
import type { AuthUser, LoginResponse, TipoMovimiento } from './types/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

type Theme = 'light' | 'dark';

function loadTheme(): Theme {
  return (localStorage.getItem('theme') as Theme) ?? 'light';
}

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(loadTheme);
  const [user, setUser] = useState<AuthUser | null>(loadUser);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [syncStatus] = useState<'ok' | 'warn'>('ok');
  const [posOpen, setPosOpen] = useState(false);
  const [movDrawer, setMovDrawer] = useState<{ open: boolean; productoId?: number; tipo?: TipoMovimiento }>({ open: false });
  const [toast, setToast] = useState<ToastData | null>(null);

  const showToast = useCallback((kind: 'success' | 'error' | 'info', title: string) => {
    setToast({ id: Date.now(), kind, title });
  }, []);

  const openPos = useCallback(() => setPosOpen(true), []);
  const closePos = useCallback(() => setPosOpen(false), []);

  const openMovimiento = useCallback((productoId?: number, tipo?: TipoMovimiento) => {
    setMovDrawer({ open: true, productoId, tipo });
  }, []);
  const closeMovimiento = useCallback(() => setMovDrawer({ open: false }), []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  }, []);

  const handleLogin = useCallback((res: LoginResponse) => {
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.usuario));
    setUser(res.usuario);
    queryClient.clear();
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    queryClient.clear();
  }, []);

  if (!user) {
    return (
      <QueryClientProvider client={queryClient}>
        <Login onLogin={handleLogin} />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Topbar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          theme={theme}
          onThemeToggle={toggleTheme}
          user={user}
          onLogout={handleLogout}
          onNuevaVenta={openPos}
        />
        <ErrorBoundary>
          {activeTab === 'dashboard' && <Dashboard user={user} syncStatus={syncStatus} onAddStock={(id) => openMovimiento(id, 'ENTRADA')} />}
          {activeTab === 'productos' && (
            <Productos
              user={user}
              onAjustarStock={(id) => openMovimiento(id, 'AJUSTE')}
              onSuccess={(msg) => showToast('success', msg)}
              onInfo={(msg) => showToast('info', msg)}
              onError={(msg) => showToast('error', msg)}
            />
          )}
          {activeTab === 'ventas' && (
            <Ventas
              user={user}
              onNuevaVenta={openPos}
              onInfo={(msg) => showToast('info', msg)}
              onError={(msg) => showToast('error', msg)}
            />
          )}
          {activeTab === 'movimientos' && <Movimientos onRegistrarMovimiento={() => openMovimiento()} />}
          {activeTab === 'reportes' && <Reportes />}
          {activeTab === 'usuarios' && (
            <Usuarios
              user={user}
              onSuccess={(msg) => showToast('success', msg)}
              onInfo={(msg) => showToast('info', msg)}
              onError={(msg) => showToast('error', msg)}
            />
          )}
          {!['dashboard', 'productos', 'ventas', 'movimientos', 'reportes', 'usuarios'].includes(activeTab) && (
            <div className="page" style={{ paddingTop: 80, textAlign: 'center', color: 'var(--muted)' }}>
              Esta sección está en construcción.
            </div>
          )}
        </ErrorBoundary>
        <NuevaVentaOverlay
          open={posOpen}
          onClose={closePos}
          onSuccess={(msg) => showToast('success', msg)}
          onError={(msg) => showToast('error', msg)}
        />
        <MovimientoDrawer
          open={movDrawer.open}
          onClose={closeMovimiento}
          prefillProductoId={movDrawer.productoId}
          prefillTipo={movDrawer.tipo}
          onSuccess={(msg) => showToast('success', msg)}
          onError={(msg) => showToast('error', msg)}
        />
        <Toast toast={toast} onDismiss={() => setToast(null)} />
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
