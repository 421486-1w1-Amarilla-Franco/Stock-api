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
import PlaceholderPage from './components/PlaceholderPage';
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

  const showToast = useCallback((kind: 'success' | 'error', title: string) => {
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
          {activeTab === 'productos' && <Productos user={user} onAjustarStock={(id) => openMovimiento(id, 'AJUSTE')} />}
          {activeTab === 'ventas' && <Ventas user={user} onNuevaVenta={openPos} />}
          {activeTab === 'movimientos' && <Movimientos onRegistrarMovimiento={() => openMovimiento()} />}
          {activeTab === 'reportes' && (
            <PlaceholderPage
              eyebrow="Análisis"
              title="Reportes"
              features={[
                { label: 'Reporte de ventas por rango de fechas' },
                { label: 'Valor de inventario actual y proyección' },
                { label: 'Ranking de productos más vendidos por unidades e ingresos' },
                { label: 'Comparativa mes a mes y export a CSV/PDF' },
              ]}
            />
          )}
          {activeTab === 'usuarios' && (
            <PlaceholderPage
              eyebrow="Administración"
              title="Usuarios"
              features={[
                { label: 'Listado de usuarios activos con su rol (ADMIN / OPERADOR)' },
                { label: 'Crear, editar y deshabilitar cuentas' },
                { label: 'Reseteo de contraseña y auditoría de accesos' },
                { label: 'Permisos granulares por endpoint' },
              ]}
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
