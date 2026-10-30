import { useEffect, useState } from 'react';
import Drawer from './Drawer';
import { useGuardarCliente, useGuardarVehiculo, type ClienteInput, type VehiculoInput } from '../hooks/useTaller';
import { useApp } from '../lib/app-context';
import { apiError } from '../lib/errors';
import type { ClienteResponse, VehiculoResponse } from '../types/api';

export function ClienteDrawer({ open, cliente, onClose, onSaved }: {
  open: boolean; cliente: ClienteResponse | null; onClose: () => void; onSaved?: (c: ClienteResponse) => void;
}) {
  const { toast } = useApp();
  const guardar = useGuardarCliente();
  const [f, setF] = useState<ClienteInput>({ nombre: '' });

  useEffect(() => {
    if (open) setF(cliente ? {
      nombre: cliente.nombre, telefono: cliente.telefono ?? '', email: cliente.email ?? '',
      documento: cliente.documento ?? '', notas: cliente.notas ?? '',
    } : { nombre: '', telefono: '', email: '', documento: '', notas: '' });
  }, [open, cliente]);

  const set = (k: keyof ClienteInput) => (e: React.ChangeEvent<HTMLInputElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  const save = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!f.nombre.trim()) return;
    guardar.mutate({ id: cliente?.id, data: f }, {
      onSuccess: (c) => { toast('success', cliente ? 'Cliente actualizado' : `Cliente ${c.nombre} creado`); onSaved?.(c); onClose(); },
      onError: (err) => toast('error', apiError(err, 'No se pudo guardar el cliente')),
    });
  };

  return (
    <Drawer open={open} onClose={onClose} title={cliente ? 'Editar cliente' : 'Nuevo cliente'}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={() => save()} disabled={!f.nombre.trim() || guardar.isPending}>
          {cliente ? 'Guardar cambios' : 'Crear cliente'}
        </button>
      </>}>
      <form className="form" onSubmit={save}>
        <label className="field">
          <span className="field-label">Nombre <span className="field-req">*</span></span>
          <input className="input" value={f.nombre} onChange={set('nombre')} autoFocus placeholder="Ej: Juan Pérez" />
        </label>
        <div className="form-row form-row-2">
          <label className="field"><span className="field-label">Teléfono</span>
            <input className="input" type="tel" value={f.telefono} onChange={set('telefono')} /></label>
          <label className="field"><span className="field-label">DNI / CUIT</span>
            <input className="input" value={f.documento} onChange={set('documento')} /></label>
        </div>
        <label className="field"><span className="field-label">Email</span>
          <input className="input" type="email" value={f.email} onChange={set('email')} /></label>
        <label className="field"><span className="field-label">Notas</span>
          <input className="input" value={f.notas} onChange={set('notas')} maxLength={255} /></label>
        <button type="submit" hidden />
      </form>
    </Drawer>
  );
}

export function VehiculoDrawer({ open, clienteId, vehiculo, onClose }: {
  open: boolean; clienteId: number; vehiculo: VehiculoResponse | null; onClose: () => void;
}) {
  const { toast } = useApp();
  const guardar = useGuardarVehiculo();
  const [f, setF] = useState<{ patente: string; marca: string; modelo: string; anio: string; km: string }>(
    { patente: '', marca: '', modelo: '', anio: '', km: '' });

  useEffect(() => {
    if (open) setF(vehiculo ? {
      patente: vehiculo.patente, marca: vehiculo.marca ?? '', modelo: vehiculo.modelo ?? '',
      anio: vehiculo.anio ? String(vehiculo.anio) : '', km: vehiculo.km != null ? String(vehiculo.km) : '',
    } : { patente: '', marca: '', modelo: '', anio: '', km: '' });
  }, [open, vehiculo]);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  const save = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!f.patente.trim()) return;
    const data: VehiculoInput = {
      patente: f.patente, marca: f.marca, modelo: f.modelo,
      anio: f.anio ? Number(f.anio) : null, km: f.km ? Number(f.km) : null,
    };
    guardar.mutate({ clienteId, id: vehiculo?.id, data }, {
      onSuccess: (v) => { toast('success', `Vehículo ${v.patente} guardado`); onClose(); },
      onError: (err) => toast('error', apiError(err, 'No se pudo guardar el vehículo')),
    });
  };

  return (
    <Drawer open={open} onClose={onClose} title={vehiculo ? `Editar ${vehiculo.patente}` : 'Agregar vehículo'}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={() => save()} disabled={!f.patente.trim() || guardar.isPending}>Guardar</button>
      </>}>
      <form className="form" onSubmit={save}>
        <label className="field">
          <span className="field-label">Patente <span className="field-req">*</span></span>
          <input className="input mono input-patente" value={f.patente} onChange={set('patente')} autoFocus
            placeholder="AB 123 CD" autoCapitalize="characters" />
        </label>
        <div className="form-row form-row-2">
          <label className="field"><span className="field-label">Marca</span>
            <input className="input" value={f.marca} onChange={set('marca')} /></label>
          <label className="field"><span className="field-label">Modelo</span>
            <input className="input" value={f.modelo} onChange={set('modelo')} /></label>
        </div>
        <div className="form-row form-row-2">
          <label className="field"><span className="field-label">Año</span>
            <input className="input" type="number" min="1900" max="2100" value={f.anio} onChange={set('anio')} /></label>
          <label className="field"><span className="field-label">Kilometraje</span>
            <input className="input" type="number" min="0" value={f.km} onChange={set('km')} /></label>
        </div>
        <button type="submit" hidden />
      </form>
    </Drawer>
  );
}
