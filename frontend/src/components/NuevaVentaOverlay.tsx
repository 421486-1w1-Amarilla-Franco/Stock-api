import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { ShoppingCart, X, Minus, Plus, ArrowRight, AlertCircle } from 'lucide-react';
import { useProductos } from '../hooks/useProductos';
import { useCrearVenta } from '../hooks/useVentas';
import { fmtARS } from '../lib/format';
import { apiError } from '../lib/errors';
import { useApp } from '../lib/app-context';
import { MEDIOS_PAGO, type MedioPago } from '../types/api';
import ConfirmModal from './ConfirmModal';
import ClientePicker, { type ClienteSeleccion } from './ClientePicker';

interface CartItem { productoId: number; cantidad: number; }

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Punto de venta pensado para teclado y lector de código de barras:
 * escribir o escanear + Enter agrega · ↑↓ elige resultado · F9 cobra · Esc cancela.
 */
export default function NuevaVentaOverlay({ open, onClose }: Props) {
  const { toast } = useApp();
  const { data: productos = [] } = useProductos();
  const crearVenta = useCrearVenta();
  const searchRef = useRef<HTMLInputElement>(null);

  const [q, setQ] = useState('');
  const [hi, setHi] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [observaciones, setObservaciones] = useState('');
  const [medioPago, setMedioPago] = useState<MedioPago>('EFECTIVO');
  const [manoObra, setManoObra] = useState('');
  const [km, setKm] = useState('');
  const [cliente, setCliente] = useState<ClienteSeleccion | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  useEffect(() => {
    if (open) {
      setQ(''); setHi(0); setCart([]); setObservaciones(''); setMedioPago('EFECTIVO');
      setManoObra(''); setKm(''); setCliente(null); setConfirmDiscard(false);
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  const productosFiltrados = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return productos
      .filter((p) => p.activo)
      .filter((p) => !qq || p.nombre.toLowerCase().includes(qq) || (p.codigo ?? '').toLowerCase().includes(qq))
      .slice(0, 40);
  }, [productos, q]);

  useEffect(() => { setHi(0); }, [q]);

  const addToCart = useCallback((productoId: number) => {
    setCart((c) => {
      const ex = c.find((it) => it.productoId === productoId);
      if (ex) return c.map((it) => it.productoId === productoId ? { ...it, cantidad: it.cantidad + 1 } : it);
      return [...c, { productoId, cantidad: 1 }];
    });
  }, []);

  const updateQty = useCallback((productoId: number, delta: number) => {
    setCart((c) => c.map((it) => it.productoId === productoId ? { ...it, cantidad: it.cantidad + delta } : it)
      .filter((it) => it.cantidad > 0));
  }, []);

  const setQty = useCallback((productoId: number, value: string) => {
    const n = Math.max(0, Math.floor(Number(value) || 0));
    setCart((c) => n === 0
      ? c.filter((it) => it.productoId !== productoId)
      : c.map((it) => it.productoId === productoId ? { ...it, cantidad: n } : it));
  }, []);

  const productoById = useMemo(() => new Map(productos.map((p) => [p.id, p])), [productos]);

  const lines = cart.map((it) => {
    const p = productoById.get(it.productoId);
    return { producto: p, cantidad: it.cantidad, subtotal: (p?.precioVenta ?? 0) * it.cantidad };
  });
  const mo = Math.max(0, Number(manoObra) || 0);
  const subtotal = lines.reduce((s, l) => s + l.subtotal, 0);
  const total = subtotal + mo;
  const itemsCount = lines.reduce((s, l) => s + l.cantidad, 0);
  const stockIssues = lines.filter((l) => l.cantidad > (l.producto?.stockActual ?? 0));
  const canSubmit = cart.length > 0 && stockIssues.length === 0 && !crearVenta.isPending;

  const requestClose = useCallback(() => {
    if (cart.length > 0) setConfirmDiscard(true);
    else onClose();
  }, [cart.length, onClose]);

  const handleCrear = useCallback(() => {
    if (!canSubmit) return;
    crearVenta.mutate(
      {
        observaciones: observaciones.trim() || undefined,
        detalles: cart.map((it) => ({ productoId: it.productoId, cantidad: it.cantidad })),
        medioPago,
        manoObra: mo || undefined,
        clienteId: cliente?.cliente.id,
        vehiculoId: cliente?.vehiculo?.id,
        kmVehiculo: cliente?.vehiculo && km ? Number(km) : undefined,
      },
      {
        onSuccess: (venta) => {
          toast('success', `Venta #${venta.id} registrada · ${fmtARS(venta.total)} · ${MEDIOS_PAGO.find((m) => m.id === venta.medioPago)?.label}`);
          onClose();
        },
        onError: (err) => toast('error', apiError(err, 'Error al registrar la venta')),
      },
    );
  }, [canSubmit, crearVenta, observaciones, cart, medioPago, mo, cliente, km, toast, onClose]);

  useEffect(() => {
    if (!open || confirmDiscard) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose();
      else if (e.key === 'F9') { e.preventDefault(); handleCrear(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, confirmDiscard, requestClose, handleCrear]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi((h) => Math.min(h + 1, productosFiltrados.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const code = q.trim().toUpperCase();
      // Lector de código de barras: escribe el código exacto y manda Enter.
      const exact = code && productos.find((p) => p.activo && (p.codigo ?? '').toUpperCase() === code);
      const target = exact || productosFiltrados[hi];
      if (!target) return;
      if (target.stockActual === 0) { toast('error', `${target.nombre}: sin stock`); return; }
      addToCart(target.id);
      setQ('');
    }
  };

  if (!open) return null;

  return (
    <div className="overlay-root" role="dialog" aria-modal="true" aria-labelledby="pos-title">
      <header className="overlay-head">
        <div className="overlay-title">
          <h2 id="pos-title">Nueva venta</h2>
        </div>
        <div className="overlay-actions">
          <span className="kbd-hint"><kbd>Enter</kbd> agrega · <kbd>F9</kbd> cobra · <kbd>Esc</kbd> cancela</span>
          <button className="icon-btn" onClick={requestClose} aria-label="Cerrar"><X size={18} /></button>
        </div>
      </header>

      <div className="overlay-body">
        {/* Catálogo */}
        <section className="pos-catalog" aria-label="Catálogo">
          <div className="pos-search">
            <input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onSearchKey}
              placeholder="Escaneá o escribí nombre / código…"
              aria-label="Buscar producto"
              aria-describedby="pos-search-count"
            />
            <span className="pos-search-count" id="pos-search-count">
              {productosFiltrados.length} resultado{productosFiltrados.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="pos-grid">
            {productosFiltrados.map((p, i) => {
              const inCart = cart.find((it) => it.productoId === p.id);
              const out = p.stockActual === 0;
              return (
                <button
                  key={p.id}
                  className={`pos-card${inCart ? ' is-incart' : ''}${out ? ' is-out' : ''}${i === hi && q ? ' is-hi' : ''}`}
                  onClick={() => { addToCart(p.id); searchRef.current?.focus(); }}
                  disabled={out}
                  tabIndex={-1}
                >
                  <div className="pos-card-head">
                    <span className={`chip chip-sm ${p.categoria === 'LUBRICANTE' ? 'chip-lub' : 'chip-rep'}`}>
                      {p.categoria === 'LUBRICANTE' ? 'Lub' : 'Rep'}
                    </span>
                    <span className="pos-card-code">{p.codigo}</span>
                  </div>
                  <div className="pos-card-name">{p.nombre}</div>
                  <div className="pos-card-foot">
                    <div className="pos-card-price">{fmtARS(p.precioVenta)}</div>
                    <div className={`pos-card-stock${p.stockActual <= p.stockMinimo ? ' is-low' : ''}`}>
                      {out ? 'Sin stock' : `${p.stockActual} u.`}
                    </div>
                  </div>
                  {inCart && <div className="pos-card-incart">×{inCart.cantidad}</div>}
                </button>
              );
            })}
            {productosFiltrados.length === 0 && (
              <div className="empty-state pos-empty">
                <div className="empty-title">Sin resultados</div>
                <div className="empty-sub">Probá con otro nombre o código.</div>
              </div>
            )}
          </div>
        </section>

        {/* Carrito y cobro */}
        <aside className="pos-cart" aria-label="Carrito">
          <div className="pos-cart-head">
            <div>
              <div className="pos-cart-title">Carrito</div>
              <div className="pos-cart-sub">{itemsCount} ítem{itemsCount === 1 ? '' : 's'}</div>
            </div>
            {cart.length > 0 && <button className="link-btn" onClick={() => setCart([])}>Vaciar</button>}
          </div>

          <div className="pos-cart-list">
            {cart.length === 0 && (
              <div className="pos-cart-empty">
                <ShoppingCart size={24} strokeWidth={1.5} className="pos-cart-empty-icon" aria-hidden="true" />
                <div className="pos-cart-empty-text">El carrito está vacío</div>
                <div className="pos-cart-empty-sub">Escaneá un código o elegí un producto.</div>
              </div>
            )}
            {lines.map(({ producto, cantidad, subtotal: sub }) => {
              if (!producto) return null;
              const overstock = cantidad > producto.stockActual;
              return (
                <div key={producto.id} className={`pos-line${overstock ? ' is-error' : ''}`}>
                  <div className="pos-line-main">
                    <div className="pos-line-name">{producto.nombre}</div>
                    <div className="pos-line-meta">
                      {producto.codigo && <span className="mono">{producto.codigo}</span>}
                      <span>{fmtARS(producto.precioVenta)} c/u</span>
                      {overstock && <span className="pos-line-warn">Hay {producto.stockActual}</span>}
                    </div>
                  </div>
                  <div className="pos-line-qty">
                    <button onClick={() => updateQty(producto.id, -1)} aria-label={`Restar uno de ${producto.nombre}`}><Minus size={12} /></button>
                    <input type="text" inputMode="numeric" aria-label={`Cantidad de ${producto.nombre}`}
                      value={cantidad} onChange={(e) => setQty(producto.id, e.target.value)} />
                    <button onClick={() => updateQty(producto.id, 1)} aria-label={`Sumar uno de ${producto.nombre}`}><Plus size={12} /></button>
                  </div>
                  <div className="pos-line-sub"><strong>{fmtARS(sub)}</strong></div>
                </div>
              );
            })}
          </div>

          <div className="pos-cart-foot">
            <div className="pos-field">
              <span className="pos-field-label" id="pos-cliente-label">Cliente / vehículo</span>
              <ClientePicker value={cliente} onChange={setCliente} onError={(m) => toast('error', m)} />
            </div>

            <div className="pos-row">
              <label className="pos-field">
                <span className="pos-field-label">Mano de obra</span>
                <div className="field-control has-prefix">
                  <span className="field-prefix">$</span>
                  <input className="input" type="number" min="0" step="100" inputMode="numeric"
                    value={manoObra} onChange={(e) => setManoObra(e.target.value)} placeholder="0" />
                </div>
              </label>
              {cliente?.vehiculo && (
                <label className="pos-field">
                  <span className="pos-field-label">Kilometraje</span>
                  <input className="input" type="number" min="0" inputMode="numeric" value={km}
                    onChange={(e) => setKm(e.target.value)} placeholder={cliente.vehiculo.km ? `últ. ${cliente.vehiculo.km}` : 'km'} />
                </label>
              )}
            </div>

            <div className="pos-field">
              <span className="pos-field-label" id="pos-pago-label">Medio de pago</span>
              <div className="seg seg-full" role="radiogroup" aria-labelledby="pos-pago-label">
                {MEDIOS_PAGO.map((m) => (
                  <button key={m.id} type="button" role="radio" aria-checked={medioPago === m.id}
                    className={`seg-btn${medioPago === m.id ? ' is-active' : ''}`} onClick={() => setMedioPago(m.id)}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="pos-field pos-obs">
              <span className="pos-field-label">Observaciones</span>
              <input className="input" value={observaciones} onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Notas del trabajo…" maxLength={255} />
            </label>

            <div className="pos-totals">
              {mo > 0 && (
                <>
                  <div className="pos-total-row"><span>Repuestos</span><span className="num">{fmtARS(subtotal)}</span></div>
                  <div className="pos-total-row"><span>Mano de obra</span><span className="num">{fmtARS(mo)}</span></div>
                </>
              )}
              <div className="pos-total-row pos-total-main">
                <span>Total</span>
                <strong className="num">{fmtARS(total)}</strong>
              </div>
            </div>

            {stockIssues.length > 0 && (
              <div className="hint hint-error" role="alert">
                <AlertCircle size={14} aria-hidden="true" />
                {stockIssues.length} producto{stockIssues.length === 1 ? '' : 's'} sin stock suficiente.
              </div>
            )}

            <button className="btn btn-accent btn-block" onClick={handleCrear} disabled={!canSubmit}>
              {crearVenta.isPending ? 'Registrando…' : `Cobrar ${fmtARS(total)}`}
              {!crearVenta.isPending && <ArrowRight size={15} aria-hidden="true" />}
              <kbd>F9</kbd>
            </button>
          </div>
        </aside>
      </div>

      <ConfirmModal
        open={confirmDiscard}
        title="¿Descartar la venta?"
        description={`Hay ${itemsCount} producto${itemsCount === 1 ? '' : 's'} en el carrito. Si salís, se pierden.`}
        confirmLabel="Descartar"
        cancelLabel="Seguir vendiendo"
        danger
        onConfirm={() => { setConfirmDiscard(false); onClose(); }}
        onCancel={() => setConfirmDiscard(false)}
      />
    </div>
  );
}
