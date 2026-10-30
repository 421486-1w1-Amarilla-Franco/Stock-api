import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ProductoResponse, Categoria } from '../types/api';

export interface ProductoRequest {
  nombre: string;
  codigo?: string;
  categoria: Categoria;
  descripcion?: string;
  precioCosto: number;
  precioVenta: number;
  /** Solo se usa al crear: después el stock cambia vía movimientos, ventas o compras. */
  stockActual: number;
  stockMinimo: number;
}

// ponytail: catálogo completo en memoria (cientos de ítems); el POS y ⌘K lo buscan local. Paginar si pasa los miles.
export const useProductos = () =>
  useQuery<ProductoResponse[]>({
    queryKey: ['productos'],
    queryFn: () => api.get('/productos?incluirInactivos=true').then((r) => r.data),
    staleTime: 30_000,
  });

export const useCrearProducto = () =>
  useMutation({ mutationFn: (data: ProductoRequest) => api.post('/productos', data).then((r) => r.data) });

export const useActualizarProducto = () =>
  useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductoRequest }) =>
      api.put(`/productos/${id}`, data).then((r) => r.data),
  });

export const useEliminarProducto = () =>
  useMutation({ mutationFn: (id: number) => api.delete(`/productos/${id}`) });

export const useRestaurarProducto = () =>
  useMutation({ mutationFn: (id: number) => api.post(`/productos/${id}/restaurar`).then((r) => r.data) });
