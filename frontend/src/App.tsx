import { useState, useEffect, useCallback, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Productos from './pages/Productos';
import ProductoDetalle from './pages/ProductoDetalle';
import Ventas from './pages/Ventas';
import Movimientos from './pages/Movimientos';
import Clientes from './pages/Clientes';
import ClienteDetalle from './pages/ClienteDetalle';
import Compras from './pages/Compras';
import Caja from './pages/Caja';
import Reportes from './pages/Reportes';
import Usuarios from './pages/Usuarios';
import Login from './pages/Login';
import NuevaVentaOverlay from './components/NuevaVentaOverlay';
import MovimientoDrawer from './components/MovimientoDrawer';
import CommandPalette from './components/CommandPalette';
import Toast, { type ToastData } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import { AppContext, type AppActions, type ToastKind } from './lib/app-context';
import type { AuthUser, LoginResponse, TipoMovimiento } from './types/api';

// ponytail: cualquier mutación refresca todas las queries; dataset chico, evita keys desincronizadas.
const queryClient: QueryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
  mutationCache: new MutationCache({
    onSuccess: () => queryClient.invalidateQueries(),
  }),
});

type Theme = 'light' | 'dark';

function loadTheme(): Theme {
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
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
  const [posOpen, setPosOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [movDrawer, setMovDrawer] = useState<{ open: boolean; productoId?: number; tipo?: TipoMovimiento }>({ open: false });
  const [toast, setToast] = useState<ToastData | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Atajos globales: Ctrl/⌘+K busca, F2 abre una venta nueva.
  useEffect(() => {
    if (!user) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      } else if (e.key === 'F2' && !posOpen) {
        e.preventDefault();
        setPosOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [user, posOpen]);

  const showToast = useCallback((kind: ToastKind, title: string) => {
    setToast({ id: Date.now(), kind, title });
  }, []);

  const closePos = useCallback(() => setPosOpen(false), []);
  const closeMovimiento = useCallback(() => setMovDrawer({ open: false }), []);

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

  const actions = useMemo<AppActions | null>(() => user && {
    user,
    isAdmin: user.rol === 'ADMIN',
    toast: showToast,
    openPos: () => setPosOpen(true),
    openMovimiento: (productoId, tipo) => setMovDrawer({ open: true, productoId, tipo }),
    openPalette: () => setPaletteOpen(true),
  }, [user, showToast]);

  if (!user || !actions) {
    return (
      <QueryClientProvider client={queryClient}>
        <Login onLogin={handleLogin} />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AppContext.Provider value={actions}>
        <BrowserRouter>
          <ErrorBoundary>
            <Layout theme={theme} onThemeToggle={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))} onLogout={handleLogout}>
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/productos" element={<Productos />} />
                  <Route path="/productos/:id" element={<ProductoDetalle />} />
                  <Route path="/movimientos" element={<Movimientos />} />
                  <Route path="/ventas" element={<Ventas />} />
                  <Route path="/caja" element={<Caja />} />
                  <Route path="/clientes" element={<Clientes />} />
                  <Route path="/clientes/:id" element={<ClienteDetalle />} />
                  <Route path="/compras" element={<Compras />} />
                  <Route path="/reportes" element={<Reportes />} />
                  {actions.isAdmin && <Route path="/usuarios" element={<Usuarios />} />}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </ErrorBoundary>
            </Layout>
            <NuevaVentaOverlay open={posOpen} onClose={closePos} />
            <MovimientoDrawer
              open={movDrawer.open}
              onClose={closeMovimiento}
              prefillProductoId={movDrawer.productoId}
              prefillTipo={movDrawer.tipo}
            />
            <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
            <Toast toast={toast} onDismiss={() => setToast(null)} />
          </ErrorBoundary>
        </BrowserRouter>
      </AppContext.Provider>
    </QueryClientProvider>
  );
}
