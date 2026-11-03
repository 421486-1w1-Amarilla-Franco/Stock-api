import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { isoDate } from '../lib/format';
import type { ProductoResponse, ReporteVentasResponse, ResumenResponse } from '../types/api';

const STALE = 30_000;
const POLL  = 30_000;

export const useStock = () =>
  useQuery<ProductoResponse[]>({
    queryKey: ['stock'],
    queryFn: () => api.get('/reportes/stock').then((r) => r.data),
    staleTime: STALE,
  });

export const useBajoStock = () =>
  useQuery<ProductoResponse[]>({
    queryKey: ['bajo-stock'],
    queryFn: () => api.get('/productos/bajo-stock').then((r) => r.data),
    staleTime: STALE,
    refetchInterval: POLL,
  });

/** KPIs del dashboard (período actual vs. anterior) en un solo pedido. */
export const useResumen = (dias = 30) =>
  useQuery<ResumenResponse>({
    queryKey: ['resumen', dias],
    queryFn: () => api.get('/reportes/resumen', { params: { dias } }).then((r) => r.data),
    staleTime: STALE,
    refetchInterval: POLL,
  });

export const useReporteVentas = (desde: Date, hasta: Date) =>
  useQuery<ReporteVentasResponse>({
    queryKey: ['reporte-ventas', isoDate(desde), isoDate(hasta)],
    queryFn: () =>
      api.get('/reportes/ventas', { params: { desde: isoDate(desde), hasta: isoDate(hasta) } }).then((r) => r.data),
    staleTime: STALE,
  });
