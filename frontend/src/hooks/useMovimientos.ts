import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { MovimientoResponse, Page, TipoMovimiento } from '../types/api';

export interface FiltroMovimientos {
  q?: string;
  tipo?: TipoMovimiento;
  productoId?: number;
  page?: number;
  size?: number;
}

/** Listado paginado y filtrado en el servidor. */
export const useMovimientos = (f: FiltroMovimientos = {}) =>
  useQuery<Page<MovimientoResponse>>({
    queryKey: ['movimientos', f],
    queryFn: () => api.get('/movimientos', { params: { size: 50, ...f, q: f.q || undefined } }).then((r) => r.data),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

export const useConteoMovimientos = () =>
  useQuery<Record<TipoMovimiento | 'TODOS', number>>({
    queryKey: ['movimientos-conteo'],
    queryFn: () => api.get('/movimientos/conteo').then((r) => r.data),
  });

export const useMovimientosProducto = (productoId?: number) =>
  useQuery<MovimientoResponse[]>({
    queryKey: ['movimientos-producto', productoId],
    queryFn: () => api.get(`/movimientos/producto/${productoId}`).then((r) => r.data),
    enabled: !!productoId,
  });

interface MovimientoInput {
  productoId: number;
  tipo: TipoMovimiento;
  cantidad: number;
  nota: string;
}

export const useRegistrarMovimiento = () =>
  useMutation<MovimientoResponse, Error, MovimientoInput>({
    mutationFn: (data) => api.post('/movimientos', data).then((r) => r.data),
  });
