import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useProductos } from '../hooks/useProductos';
import { useCrearVenta } from '../hooks/useVentas';
import { fmtARS } from '../lib/format';

interface CartItem { productoId: number; cantidad: number; }

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export default function NuevaVentaOverlay({ open, onClose, onSuccess, onError }: Props) {
  const { data: productos = [] } = useProductos();
  const crearVenta = useCrearVenta();
  const searchRef = useRef<HTMLInputElement>(null);

  const [q, setQ] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    if (open) {
      setQ(''); setCart([]); setObservaciones('');
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);

  const productosFiltrados = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return productos
      .filter((p) => p.activo)
      .filter((p) => !qq || p.nombre.toLowerCase().includes(qq) || (p.codigo ?? '').toLowerCase().includes(qq))
      .slice(0, 30);
  }, [productos, q]);

  const addToCart = useCallback((productoId: number) => {
    setCart((c) => {
      const ex = c.find((it) => it.productoId === productoId);
      if (ex) return c.map((it) => it.productoId === productoId ? { ...it, cantidad: it.cantidad + 1 } : it);
      return [...c, { productoId, cantidad: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productoId: number) => {
    setCart((c) => c.filter((it) => it.productoId !== productoId));
  }, []);

  const updateQty = useCallback((productoId: number, delta: number) => {
    setCart((c) =>
      c.map((it) => it.productoId === productoId ? { ...it, cantidad: it.cantidad + delta } : it)
       .filter((it) => it.cantidad > 0),
    );
  }, []);

  const setQty = useCallback((productoId: number, value: string) => {
    const n = Math.max(0, Math.floor(Number(value) || 0));
    setCart((c) =>
      n === 0 ? c.filter((it) => it.productoId !== productoId)
              : c.map((it) => it.productoId === productoId ? { ...it, cantidad: n } : it),
    );
  }, []);

  const productoById = useCallback((id: number) => productos.find((p) => p.id === id), [productos]);

  const lines = useMemo(
    () => cart.map((it) => {
      const p = productoById(it.productoId);
      return { producto: p, cantidad: it.cantidad, subtotal: (p?.precioVenta ?? 0) * it.cantidad };
    }),
    [cart, productoById],
  );

  const total = lines.reduce((s, l) => s + l.subtotal, 0);
  const itemsCount = lines.reduce((s, l) => s + l.cantidad, 0);
  const stockIssues = lines.filter((l) => l.cantidad > (l.producto?.stockActual ?? 0));

  const handleCrear = () => {
    if (cart.length === 0 || stockIssues.length > 0 || crearVenta.isPending) return;
    crearVenta.mutate(
      { observaciones, detalles: cart.map((it) => ({ productoId: it.productoId, cantidad: it.cantidad })) },
      {
        onSuccess: (venta) => {
          onSuccess(`Venta #${venta.id} registrada · ${itemsCount} producto${itemsCount === 1 ? '' : 's'} · ${fmtARS(total)}`);
          onClose();
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje ?? 'Error al registrar la venta';
          onError(msg);
        },
      },
    );
  };

  if (!open) return null;

  return (
    <div className="overlay-root" role="dialog" aria-modal="true">
      <header className="overlay-head">
        <div className="overlay-title">
          <span className="overlay-eyebrow">Punto de venta</span>
          <h2>Nueva venta</h2>
        </div>
        <div className="overlay-actions">
          <kbd className="kbd-hint">Esc para cancelar</kbd>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>

      <div className="overlay-body">
        {/* Catálogo */}
        <section className="pos-catalog">
          <div className="pos-search">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar producto por nombre o código…"
            />
            <span className="pos-search-count">{productosFiltrados.length} resultados</span>
          </div>

          <div className="pos-grid">
            {productosFiltrados.map((p) => {
              const inCart = cart.find((it) => it.productoId === p.id);
              const out = p.stockActual === 0;
              return (
                <button
                  key={p.id}
                  className={`pos-card${inCart ? ' is-incart' : ''}${out ? ' is-out' : ''}`}
                  onClick={() => !out && addToCart(p.id)}
                  disabled={out}
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
                  {inCart && (
                    <div className="pos-card-incart">
                      <svg viewBox="0 0 24 24" width="11" height="11" fill="none">
                        <path d="m5 12 4.5 4.5L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      ×{inCart.cantidad}
                    </div>
                  )}
                </button>
              );
            })}
            {productosFiltrados.length === 0 && (
              <div className="empty-state pos-empty">
                <div className="empty-title">Sin resultados</div>
                <div className="empty-sub">Probá otro término de búsqueda.</div>
              </div>
            )}
          </div>
        </section>

        {/* Carrito */}
        <aside className="pos-cart">
          <div className="pos-cart-head">
            <div>
              <div className="pos-cart-title">Carrito</div>
              <div className="pos-cart-sub">{itemsCount} ítem{itemsCount === 1 ? '' : 's'}</div>
            </div>
            {cart.length > 0 && (
              <button className="link-btn" onClick={() => setCart([])}>Vaciar</button>
            )}
          </div>

          <div className="pos-cart-list">
            {cart.length === 0 && (
              <div className="pos-cart-empty">
                <div className="pos-cart-empty-icon">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
                    <path d="M3 5h2l2.4 12.4a2 2 0 0 0 2 1.6h8a2 2 0 0 0 2-1.6L21 8H6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="9" cy="22" r="1" fill="currentColor" />
                    <circle cx="18" cy="22" r="1" fill="currentColor" />
                  </svg>
                </div>
                <div className="pos-cart-empty-text">El carrito está vacío</div>
                <div className="pos-cart-empty-sub">Tocá un producto para agregarlo.</div>
              </div>
            )}

            {lines.map((l) => {
              const { producto, cantidad, subtotal } = l;
              if (!producto) return null;
              const overstock = cantidad > producto.stockActual;
              return (
                <div key={producto.id} className={`pos-line${overstock ? ' is-error' : ''}`}>
                  <div className="pos-line-main">
                    <div className="pos-line-name">{producto.nombre}</div>
                    <div className="pos-line-meta">
                      {producto.codigo && <span className="mono">{producto.codigo}</span>}
                      {producto.codigo && <span>·</span>}
                      <span>{fmtARS(producto.precioVenta)} c/u</span>
                      {overstock && (
                        <span className="pos-line-warn">· Excede stock ({producto.stockActual})</span>
                      )}
                    </div>
                  </div>

                  <div className="pos-line-qty">
                    <button onClick={() => updateQty(producto.id, -1)} aria-label="Disminuir">
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none">
                        <path d="M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                      </svg>
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cantidad}
                      onChange={(e) => setQty(producto.id, e.target.value)}
                    />
                    <button onClick={() => updateQty(producto.id, 1)} aria-label="Aumentar">
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none">
                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>

                  <div className="pos-line-sub">
                    <strong>{fmtARS(subtotal)}</strong>
                    <button className="pos-line-remove" onClick={() => removeFromCart(producto.id)} aria-label="Quitar">
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none">
                        <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pos-cart-foot">
            <div className="pos-obs">
              <label>Observaciones</label>
              <textarea
                rows={2}
                placeholder="Cliente, vehículo, notas…"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
            </div>

            <div className="pos-totals">
              <div className="pos-total-row">
                <span>Items</span>
                <span className="mono">{itemsCount}</span>
              </div>
              <div className="pos-total-row pos-total-main">
                <span>Total</span>
                <strong>{fmtARS(total)}</strong>
              </div>
            </div>

            {stockIssues.length > 0 && (
              <div className="hint hint-error">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                  <path d="M12 9v4M12 17v.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                </svg>
                {stockIssues.length} producto{stockIssues.length === 1 ? '' : 's'} sin stock suficiente.
              </div>
            )}

            <button
              className="btn btn-primary btn-block"
              onClick={handleCrear}
              disabled={cart.length === 0 || stockIssues.length > 0 || crearVenta.isPending}
            >
              {crearVenta.isPending ? 'Registrando…' : 'Registrar venta'}
              {!crearVenta.isPending && (
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
