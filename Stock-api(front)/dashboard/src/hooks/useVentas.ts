import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { VentaResponse } from '../types/api';

interface DetalleVentaInput {
  productoId: number;
  cantidad: number;
}

interface VentaInput {
  observaciones: string;
  detalles: DetalleVentaInput[];
}

export const useVentas = () =>
  useQuery<VentaResponse[]>({
    queryKey: ['ventas'],
    queryFn: () => api.get('/ventas').then((r) => r.data),
    staleTime: 30_000,
  });

export const useCrearVenta = () => {
  const qc = useQueryClient();
  return useMutation<VentaResponse, Error, VentaInput>({
    mutationFn: (data) => api.post('/ventas', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ventas'] });
      qc.invalidateQueries({ queryKey: ['productos'] });
      qc.invalidateQueries({ queryKey: ['movimientos'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useEliminarVenta = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api.put(`/ventas/${id}/estado`, { estado: 'ANULADA' }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ventas'] });
      qc.invalidateQueries({ queryKey: ['productos'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};
