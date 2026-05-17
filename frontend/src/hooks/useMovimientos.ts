import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { MovimientoResponse, TipoMovimiento } from '../types/api';

export const useMovimientos = () =>
  useQuery<MovimientoResponse[]>({
    queryKey: ['movimientos'],
    queryFn: () => api.get('/movimientos').then((r) => r.data),
    staleTime: 30_000,
  });

interface MovimientoInput {
  productoId: number;
  tipo: TipoMovimiento;
  cantidad: number;
  nota: string;
}

export const useRegistrarMovimiento = () => {
  const qc = useQueryClient();
  return useMutation<MovimientoResponse, Error, MovimientoInput>({
    mutationFn: (data) => api.post('/movimientos', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['movimientos'] });
      qc.invalidateQueries({ queryKey: ['productos'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};
