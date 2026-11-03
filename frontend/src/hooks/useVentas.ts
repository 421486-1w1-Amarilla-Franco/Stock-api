import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { EstadoVenta, MedioPago, Page, VentaResponse } from '../types/api';

export interface VentaInput {
  observaciones?: string;
  detalles: { productoId: number; cantidad: number }[];
  medioPago: MedioPago;
  manoObra?: number;
  clienteId?: number;
  vehiculoId?: number;
  kmVehiculo?: number;
}

export interface FiltroVentas {
  q?: string;
  estado?: EstadoVenta;
  medioPago?: MedioPago;
  desde?: string;
  hasta?: string;
  page?: number;
  size?: number;
}

/** Listado paginado y filtrado en el servidor. */
export const useVentas = (f: FiltroVentas = {}) =>
  useQuery<Page<VentaResponse>>({
    queryKey: ['ventas', f],
    queryFn: () => api.get('/ventas', { params: { size: 50, ...f, q: f.q || undefined } }).then((r) => r.data),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

export const useVenta = (id?: number) =>
  useQuery<VentaResponse>({
    queryKey: ['venta', id],
    queryFn: () => api.get(`/ventas/${id}`).then((r) => r.data),
    enabled: !!id,
  });

export const useCrearVenta = () =>
  useMutation<VentaResponse, Error, VentaInput>({
    mutationFn: (data) => api.post('/ventas', data).then((r) => r.data),
  });

export const useEliminarVenta = () =>
  useMutation({
    mutationFn: (id: number) => api.put(`/ventas/${id}/estado`, { estado: 'ANULADA' }).then((r) => r.data),
  });
