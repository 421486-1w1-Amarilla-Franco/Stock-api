import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type {
  ProductoResponse,
  MovimientoResponse,
  ReporteVentasResponse,
  VentaResponse,
} from '../types/api';

const STALE = 30_000;
const POLL  = 30_000;

const toDateParam = (d: Date): string => d.toISOString().split('T')[0];

export const useStock = () =>
  useQuery<ProductoResponse[]>({
    queryKey: ['stock'],
    queryFn: () => api.get('/reportes/stock').then((r) => r.data),
    staleTime: STALE,
    refetchInterval: POLL,
  });

export const useBajoStock = () =>
  useQuery<ProductoResponse[]>({
    queryKey: ['bajo-stock'],
    queryFn: () => api.get('/productos/bajo-stock').then((r) => r.data),
    staleTime: STALE,
    refetchInterval: POLL,
  });

export const useMovimientos = () =>
  useQuery<MovimientoResponse[]>({
    queryKey: ['movimientos'],
    queryFn: () => api.get('/movimientos').then((r) => r.data),
    staleTime: STALE,
    refetchInterval: POLL,
  });

export const useReporteVentas = (desde: Date, hasta: Date) =>
  useQuery<ReporteVentasResponse>({
    queryKey: ['reporte-ventas', toDateParam(desde), toDateParam(hasta)],
    queryFn: () =>
      api
        .get(`/reportes/ventas?desde=${toDateParam(desde)}&hasta=${toDateParam(hasta)}`)
        .then((r) => r.data),
    staleTime: STALE,
    refetchInterval: POLL,
  });

export const useVentas = () =>
  useQuery<VentaResponse[]>({
    queryKey: ['ventas'],
    queryFn: () => api.get('/ventas').then((r) => r.data),
    staleTime: STALE,
    refetchInterval: POLL,
  });
