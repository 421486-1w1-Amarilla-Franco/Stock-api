import { useState } from 'react';
import { X, Car, User, Plus } from 'lucide-react';
import { useClientes, useGuardarCliente } from '../hooks/useTaller';
import { useDebounced } from '../lib/useDebounced';
import { apiError } from '../lib/errors';
import type { ClienteResponse, VehiculoResponse } from '../types/api';

export interface ClienteSeleccion {
  cliente: ClienteResponse;
  vehiculo?: VehiculoResponse;
}

interface Props {
  value: ClienteSeleccion | null;
  onChange: (v: ClienteSeleccion | null) => void;
  onError?: (msg: string) => void;
}

/** Elegir cliente (y opcionalmente su vehículo) buscando por nombre, teléfono, documento o patente. */
export default function ClientePicker({ value, onChange, onError }: Props) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const qq = useDebounced(q.trim().toLowerCase(), 200);
  const { data: clientes = [], isFetching } = useClientes(qq, open && qq.length >= 1);
  const crear = useGuardarCliente();

  if (value) {
    const { cliente, vehiculo } = value;
    return (
      <div className="picker-chip">
        {vehiculo ? <Car size={14} aria-hidden="true" /> : <User size={14} aria-hidden="true" />}
        <div className="picker-chip-main">
          <strong>{vehiculo ? vehiculo.patente : cliente.nombre}</strong>
          <span>{vehiculo ? `${cliente.nombre} · ${[vehiculo.marca, vehiculo.modelo].filter(Boolean).join(' ')}` : 'Sin vehículo'}</span>
        </div>
        <button type="button" className="icon-btn icon-btn-sm" onClick={() => onChange(null)} aria-label="Quitar cliente">
          <X size={13} />
        </button>
      </div>
    );
  }

  const elegir = (c: ClienteResponse, v?: VehiculoResponse) => {
    onChange({ cliente: c, vehiculo: v });
    setQ('');
    setOpen(false);
  };

  return (
    <div className="picker">
      <input
        className="input"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Patente, nombre o teléfono (opcional)"
        aria-label="Buscar cliente o patente"
      />
      {open && qq.length >= 1 && (
        <ul className="picker-list" role="listbox">
          {clientes.slice(0, 6).flatMap((c) => {
            const filas = [
              <li key={`c${c.id}`}>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => elegir(c)}>
                  <User size={13} aria-hidden="true" /> <strong>{c.nombre}</strong>
                  {c.telefono && <span className="muted">{c.telefono}</span>}
                </button>
              </li>,
            ];
            c.vehiculos.forEach((v) => filas.push(
              <li key={`v${v.id}`}>
                <button type="button" className="picker-sub" onMouseDown={(e) => e.preventDefault()} onClick={() => elegir(c, v)}>
                  <Car size={13} aria-hidden="true" /> <strong className="mono">{v.patente}</strong>
                  <span className="muted">{[v.marca, v.modelo].filter(Boolean).join(' ')}</span>
                </button>
              </li>,
            ));
            return filas;
          })}
          {!isFetching && clientes.length === 0 && (
            <li>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                disabled={crear.isPending}
                onClick={() => crear.mutate({ data: { nombre: q.trim() } }, {
                  onSuccess: (c) => elegir(c),
                  onError: (err) => onError?.(apiError(err, 'No se pudo crear el cliente')),
                })}
              >
                <Plus size={13} aria-hidden="true" /> Crear cliente “{q.trim()}”
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
