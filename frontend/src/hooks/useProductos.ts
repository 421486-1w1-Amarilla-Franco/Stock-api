import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ProductoResponse, Categoria } from '../types/api';

export interface ProductoRequest {
  nombre: string;
  codigo?: string;
  categoria: Categoria;
  descripcion?: string;
  precioCosto: number;
  precioVenta: number;
  stockActual: number;
  stockMinimo: number;
}

export const useProductos = () =>
  useQuery<ProductoResponse[]>({
    queryKey: ['productos'],
    queryFn: () => api.get('/productos?incluirInactivos=true').then((r) => r.data),
    staleTime: 30_000,
  });

export const useCrearProducto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProductoRequest) => api.post('/productos', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['productos'] }),
  });
};

export const useActualizarProducto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductoRequest }) =>
      api.put(`/productos/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['productos'] }),
  });
};

export const useEliminarProducto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/productos/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['productos'] }),
  });
};

export const useRestaurarProducto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post(`/productos/${id}/restaurar`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['productos'] }),
  });
};
