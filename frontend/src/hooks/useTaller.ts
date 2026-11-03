import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query';
import { api } from '../lib/api';
import type {
  CajaResponse, CierreResponse, ClienteResponse, CompraResponse, ProveedorResponse,
  SugerenciaCompra, VehiculoResponse, VentaResponse,
} from '../types/api';

// Las mutaciones no invalidan a mano: el MutationCache global (App.tsx) refresca todo al terminar.

// ---------- Clientes y vehículos ----------

export interface ClienteInput { nombre: string; telefono?: string; email?: string; documento?: string; notas?: string }
export interface VehiculoInput { patente: string; marca?: string; modelo?: string; anio?: number | null; km?: number | null }

export const useClientes = (q: string, enabled = true) =>
  useQuery<ClienteResponse[]>({
    queryKey: ['clientes', q],
    queryFn: () => api.get('/clientes', { params: { q } }).then((r) => r.data),
    enabled,
    placeholderData: keepPreviousData,
  });

export const useCliente = (id?: number) =>
  useQuery<ClienteResponse>({
    queryKey: ['cliente', id],
    queryFn: () => api.get(`/clientes/${id}`).then((r) => r.data),
    enabled: !!id,
  });

export const useVentasCliente = (id?: number) =>
  useQuery<VentaResponse[]>({
    queryKey: ['cliente-ventas', id],
    queryFn: () => api.get(`/clientes/${id}/ventas`).then((r) => r.data),
    enabled: !!id,
  });

export const useGuardarCliente = () =>
  useMutation<ClienteResponse, Error, { id?: number; data: ClienteInput }>({
    mutationFn: ({ id, data }) =>
      (id ? api.put(`/clientes/${id}`, data) : api.post('/clientes', data)).then((r) => r.data),
  });

export const useGuardarVehiculo = () =>
  useMutation<VehiculoResponse, Error, { clienteId: number; id?: number; data: VehiculoInput }>({
    mutationFn: ({ clienteId, id, data }) =>
      (id ? api.put(`/vehiculos/${id}`, data) : api.post(`/clientes/${clienteId}/vehiculos`, data)).then((r) => r.data),
  });

// ---------- Proveedores y compras ----------

export interface ProveedorInput { nombre: string; cuit?: string; telefono?: string; email?: string }
export interface CompraInput {
  proveedorId: number;
  comprobante?: string;
  observaciones?: string;
  detalles: { productoId: number; cantidad: number; costoUnitario: number }[];
}

export const useProveedores = () =>
  useQuery<ProveedorResponse[]>({ queryKey: ['proveedores'], queryFn: () => api.get('/proveedores').then((r) => r.data) });

export const useGuardarProveedor = () =>
  useMutation<ProveedorResponse, Error, { id?: number; data: ProveedorInput }>({
    mutationFn: ({ id, data }) =>
      (id ? api.put(`/proveedores/${id}`, data) : api.post('/proveedores', data)).then((r) => r.data),
  });

export const useCompras = () =>
  useQuery<CompraResponse[]>({ queryKey: ['compras'], queryFn: () => api.get('/compras').then((r) => r.data) });

export const useSugerenciasCompra = () =>
  useQuery<SugerenciaCompra[]>({ queryKey: ['compras-sugerencias'], queryFn: () => api.get('/compras/sugerencias').then((r) => r.data) });

export const useCrearCompra = () =>
  useMutation<CompraResponse, Error, CompraInput>({ mutationFn: (data) => api.post('/compras', data).then((r) => r.data) });

export const useAccionCompra = () =>
  useMutation<CompraResponse, Error, { id: number; accion: 'recibir' | 'anular' }>({
    mutationFn: ({ id, accion }) => api.post(`/compras/${id}/${accion}`).then((r) => r.data),
  });

// ---------- Caja ----------

export const useCaja = (fecha: string) =>
  useQuery<CajaResponse>({
    queryKey: ['caja', fecha],
    queryFn: () => api.get('/caja', { params: { fecha } }).then((r) => r.data),
    refetchInterval: 30_000,
  });

export const useCierres = () =>
  useQuery<CierreResponse[]>({ queryKey: ['cierres'], queryFn: () => api.get('/caja/cierres').then((r) => r.data) });

export const useCerrarCaja = () =>
  useMutation<CierreResponse, Error, { fecha: string; efectivoContado: number; observaciones?: string }>({
    mutationFn: (data) => api.post('/caja/cierres', data).then((r) => r.data),
  });
