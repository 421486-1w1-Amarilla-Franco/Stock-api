import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { UsuarioResponse } from '../types/api';

interface UsuarioInput {
  nombre: string;
  email: string;
  password?: string;
  rol: 'ADMIN' | 'OPERADOR';
}

export const useUsuarios = () =>
  useQuery<UsuarioResponse[]>({
    queryKey: ['usuarios'],
    queryFn: () => api.get('/usuarios').then((r) => r.data),
    staleTime: 30_000,
  });

export const useCrearUsuario = () => {
  const qc = useQueryClient();
  return useMutation<UsuarioResponse, Error, UsuarioInput>({
    mutationFn: (data) => api.post('/usuarios', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }),
  });
};

export const useActualizarUsuario = () => {
  const qc = useQueryClient();
  return useMutation<UsuarioResponse, Error, { id: number } & UsuarioInput>({
    mutationFn: ({ id, ...data }) => api.put(`/usuarios/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }),
  });
};

export const useEliminarUsuario = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id) => api.delete(`/usuarios/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }),
  });
};
