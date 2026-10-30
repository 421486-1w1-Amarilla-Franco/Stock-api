import { createContext, useContext } from 'react';
import type { AuthUser, TipoMovimiento } from '../types/api';

export type ToastKind = 'success' | 'error' | 'info';

export interface AppActions {
  user: AuthUser;
  isAdmin: boolean;
  toast: (kind: ToastKind, title: string) => void;
  openPos: () => void;
  openMovimiento: (productoId?: number, tipo?: TipoMovimiento) => void;
  openPalette: () => void;
}

export const AppContext = createContext<AppActions | null>(null);

/** Acciones globales (toast, POS, movimiento, ⌘K) sin pasar props por cada página. */
export function useApp(): AppActions {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp fuera de AppContext');
  return ctx;
}
