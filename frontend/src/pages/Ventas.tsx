import { useState, useMemo } from 'react';
import { useVentas, useEliminarVenta } from '../hooks/useVentas';
import Drawer from '../components/Drawer';
import ConfirmModal from '../components/ConfirmModal';
import { fmtARS, fmtDateTime, fmtDateTimeFull, initials } from '../lib/format';
import type { VentaResponse, AuthUser } from '../types/api';

// Maps backend estado → UI display estado
type UIEstado = 'ACTIVA' | 'ELIMINADA';

function toUIEstado(estado: string): UIEstado {
  if (estado === 'ANULADA') return 'ELIMINADA';
  return 'ACTIVA'; // COMPLETADA + PENDIENTE → ACTIVA
}

const EstadoChip = ({ estado }: { estado: UIEstado }) => (
  <span className={`estado-chip ${estado === 'ACTIVA' ? 'estado-done' : 'estado-cancel'}`}>
    <span className="estado-dot" />
    {estado === 'ACTIVA' ? 'Activa' : 'Eliminada'}
  </span>
);

type FiltroKey = 'todas' | 'ACTIVA' | 'ELIMINADA';

interface DrawerState {
  open: boolean;
  venta: VentaResponse | null;
}

function VentaDrawer({
  open, venta, onClose, isAdmin, onInfo, onError,
}: {
  open: boolean;
  venta: VentaResponse | null;
  onClose: () => void;
  isAdmin: boolean;
  onInfo?: (msg: string) => void;
  onError?: (msg: string) => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const eliminar = useEliminarVenta();

  if (!venta) return null;

  const uiEstado = toUIEstado(venta.estado);

  const handleEliminar = () => {
    const n = venta.detalles.length;
    eliminar.mutate(venta.id as unknown as number, {
      onSuccess: () => {
        onInfo?.(`Venta #${venta.id} eliminada · Stock restaurado en ${n} producto${n === 1 ? '' : 's'}`);
        setConfirmOpen(false);
        onClose();
      },
      onError: (err: unknown) => {
        onError?.((err as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje ?? 'Error al eliminar la venta');
      },
    });
  };

  const footer =
    uiEstado === 'ACTIVA' && isAdmin ? (
      <>
        <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
        <button
          className="btn btn-danger"
          onClick={() => setConfirmOpen(true)}
          disabled={eliminar.isPending}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
            <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Eliminar venta
        </button>
      </>
    ) : (
      <button className="btn btn-ghost" onClick={onClose} style={{ marginLeft: 'auto' }}>
        Cerrar
      </button>
    );

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title={`Venta #${venta.id}`}
        subtitle={`${fmtDateTimeFull(venta.fecha)} · ${venta.usuarioNombre}`}
        width={540}
        footer={footer}
      >
        <div className="venta-detail">
          <div className="venta-detail-status">
            <EstadoChip estado={uiEstado} />
            {uiEstado === 'ELIMINADA' && (
              <span className="venta-detail-hint">Stock devuelto al inventario</span>
            )}
          </div>

          {venta.observaciones && (
            <div>
              <div className="venta-detail-label" style={{ marginBottom: 8 }}>Observaciones</div>
              <div className="venta-detail-obs">{venta.observaciones}</div>
            </div>
          )}

          <div>
            <div className="venta-detail-label" style={{ marginBottom: 8 }}>
              Items ({venta.detalles.length})
            </div>
            <div className="venta-lines">
              {venta.detalles.map((d) => (
                <div key={d.id} className="venta-line">
                  <div className="venta-line-main">
                    <div className="venta-line-name">{d.productoNombre}</div>
                    <div className="venta-line-meta">
                      {d.productoCodigo && (
                        <>
                          <span className="mono">{d.productoCodigo}</span>
                          <span>·</span>
                        </>
                      )}
                      <span>{d.cantidad} × {fmtARS(d.precioUnitario)}</span>
                    </div>
                  </div>
                  <div className="venta-line-sub">{fmtARS(d.subtotal)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="venta-detail-totals">
            <div className="venta-total-row">
              <span>Subtotal</span>
              <span className="mono">{fmtARS(venta.total)}</span>
            </div>
            <div className="venta-total-row venta-total-main">
              <span>Total</span>
              <strong>{fmtARS(venta.total)}</strong>
            </div>
          </div>
        </div>
      </Drawer>

      <ConfirmModal
        open={confirmOpen}
        title={`Eliminar venta #${venta.id}`}
        description="La venta se marcará como eliminada y el stock volverá al inventario. Queda registro en el historial."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        danger
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleEliminar}
      />
    </>
  );
}

export default function Ventas({ onNuevaVenta, user, onInfo, onError }: {
  onNuevaVenta?: () => void;
  user?: AuthUser | null;
  onInfo?: (msg: string) => void;
  onError?: (msg: string) => void;
}) {
  const { data: ventas = [], isLoading, isError, refetch } = useVentas();
  const [filtro, setFiltro] = useState<FiltroKey>('todas');
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, venta: null });
  const isAdmin = user?.rol === 'ADMIN';

  const list = useMemo(() => {
    let out = ventas;
    if (filtro === 'ACTIVA')    out = out.filter((v) => toUIEstado(v.estado) === 'ACTIVA');
    if (filtro === 'ELIMINADA') out = out.filter((v) => toUIEstado(v.estado) === 'ELIMINADA');
    return [...out].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [ventas, filtro]);

  const counts = useMemo(
    () => ({
      todas:     ventas.length,
      ACTIVA:    ventas.filter((v) => toUIEstado(v.estado) === 'ACTIVA').length,
      ELIMINADA: ventas.filter((v) => toUIEstado(v.estado) === 'ELIMINADA').length,
    }),
    [ventas],
  );

  const FILTROS: { id: FiltroKey; label: string }[] = [
    { id: 'todas',     label: 'Todas' },
    { id: 'ACTIVA',    label: 'Activas' },
    { id: 'ELIMINADA', label: 'Eliminadas' },
  ];

  return (
    <main className="page" style={{ paddingTop: 80 }}>
      <div className="page-head">
        <div>
          <div className="eyebrow">Transacciones</div>
          <h1 className="page-title">Ventas</h1>
          <p className="page-sub">
            {counts.ACTIVA} activa{counts.ACTIVA === 1 ? '' : 's'} · {counts.ELIMINADA} eliminada{counts.ELIMINADA === 1 ? '' : 's'} en el historial.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
              <path d="M12 3v12M6 9l6 6 6-6M5 21h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Exportar
          </button>
          <button className="btn btn-primary" onClick={onNuevaVenta}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Nueva venta
          </button>
        </div>
      </div>

      <div className="filterbar">
        <div className="seg">
          {FILTROS.map((opt) => (
            <button
              key={opt.id}
              className={`seg-btn${filtro === opt.id ? ' is-active' : ''}`}
              onClick={() => setFiltro(opt.id)}
            >
              {opt.label}
              <span className="seg-count">{counts[opt.id]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card no-pad">
        <div className="table-wrap">
          <table className="table table-clickable">
            <thead>
              <tr>
                <th scope="col" style={{ width: 80 }}>ID</th>
                <th scope="col" style={{ width: 160 }}>Fecha</th>
                <th scope="col">Observaciones</th>
                <th scope="col" style={{ width: 70, textAlign: 'right' }}>Items</th>
                <th scope="col" style={{ width: 140, textAlign: 'right' }}>Total</th>
                <th scope="col" style={{ width: 140 }}>Usuario</th>
                <th scope="col" style={{ width: 130 }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  <td><div className="skeleton" style={{ height: 14, width: 40 }} /></td>
                  <td><div className="skeleton" style={{ height: 14, width: 120 }} /></td>
                  <td><div className="skeleton" style={{ height: 14, width: '70%' }} /></td>
                  <td className="td-num"><div className="skeleton" style={{ height: 14, width: 24, marginLeft: 'auto' }} /></td>
                  <td className="td-num"><div className="skeleton" style={{ height: 14, width: 80, marginLeft: 'auto' }} /></td>
                  <td><div className="skeleton" style={{ height: 14, width: 100 }} /></td>
                  <td><div className="skeleton" style={{ height: 20, width: 80 }} /></td>
                </tr>
              ))}
              {isError && (
                <tr>
                  <td colSpan={7} className="empty-state">
                    <div className="empty-title" style={{ color: 'var(--danger)' }}>Error al cargar ventas</div>
                    <div className="empty-sub">No se pudo conectar con el servidor.</div>
                    <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => refetch()}>Reintentar</button>
                  </td>
                </tr>
              )}
              {!isLoading && !isError && list.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-state">
                    <div className="empty-title">Sin ventas en este filtro</div>
                    <div className="empty-sub">Probá otro estado o creá una venta nueva.</div>
                  </td>
                </tr>
              )}
              {!isLoading && !isError && list.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => setDrawer({ open: true, venta: v })}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDrawer({ open: true, venta: v }); } }}
                >
                  <td className="td-id">#{v.id}</td>
                  <td className="td-muted" style={{ fontSize: 13 }}>{fmtDateTime(v.fecha)}</td>
                  <td>
                    {v.observaciones
                      ? <span className="td-product-name">{v.observaciones}</span>
                      : <em style={{ color: 'var(--muted)', fontStyle: 'italic', fontSize: 13 }}>Sin observaciones</em>
                    }
                  </td>
                  <td className="td-num">{v.detalles.length}</td>
                  <td className="td-num"><strong>{fmtARS(v.total)}</strong></td>
                  <td>
                    <div className="td-user">
                      <div className="avatar avatar-sm">{initials(v.usuarioNombre)}</div>
                      <span style={{ fontSize: 13 }}>{v.usuarioNombre}</span>
                    </div>
                  </td>
                  <td><EstadoChip estado={toUIEstado(v.estado)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && !isError && (
          <div className="table-foot">
            <span>{list.length} ventas</span>
          </div>
        )}
      </div>

      <VentaDrawer
        open={drawer.open}
        venta={drawer.venta}
        onClose={() => setDrawer({ open: false, venta: null })}
        isAdmin={isAdmin}
        onInfo={onInfo}
        onError={onError}
      />
    </main>
  );
}
