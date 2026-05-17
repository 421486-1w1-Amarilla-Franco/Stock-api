import { useState, useMemo, useEffect, useRef } from 'react';
import Drawer from './Drawer';
import { useProductos } from '../hooks/useProductos';
import { useRegistrarMovimiento } from '../hooks/useMovimientos';
import { fmtARS } from '../lib/format';
import type { TipoMovimiento } from '../types/api';

interface Props {
  open: boolean;
  onClose: () => void;
  prefillProductoId?: number;
  prefillTipo?: TipoMovimiento;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

const TIPOS: { key: TipoMovimiento; label: string; desc: string }[] = [
  { key: 'ENTRADA', label: 'Entrada',  desc: 'Compra, devolución de cliente, reposición de proveedor.' },
  { key: 'SALIDA',  label: 'Salida',   desc: 'Consumo interno, rotura, pérdida o uso en taller sin venta.' },
  { key: 'AJUSTE',  label: 'Ajuste',   desc: 'Corrección por inventario físico o discrepancia detectada.' },
];

const NOTA_PLACEHOLDER: Record<TipoMovimiento, string> = {
  ENTRADA: 'Ej: OC 2026-042, devolución cliente…',
  SALIDA:  'Ej: Rotura, uso interno…',
  AJUSTE:  'Ej: Inventario físico, diferencia detectada…',
};

export default function MovimientoDrawer({ open, onClose, prefillProductoId, prefillTipo = 'ENTRADA', onSuccess, onError }: Props) {
  const { data: productos = [] } = useProductos();
  const registrar = useRegistrarMovimiento();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [productoId, setProductoId] = useState<number | null>(null);
  const [tipo, setTipo] = useState<TipoMovimiento>('ENTRADA');
  const [cantidad, setCantidad] = useState(1);
  const [ajusteSign, setAjusteSign] = useState<1 | -1>(1);
  const [nota, setNota] = useState('');
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setProductoId(prefillProductoId ?? null);
    setTipo(prefillTipo);
    setCantidad(1);
    setAjusteSign(1);
    setNota('');
    setSearch('');
    setSearchOpen(!prefillProductoId);
  }, [open, prefillProductoId, prefillTipo]);

  useEffect(() => {
    if (open && searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [open, searchOpen]);

  const producto = productoId ? productos.find((p) => p.id === productoId) ?? null : null;

  const productosFiltrados = useMemo(() => {
    const qq = search.trim().toLowerCase();
    return productos
      .filter((p) => p.activo)
      .filter((p) => !qq || p.nombre.toLowerCase().includes(qq) || (p.codigo ?? '').toLowerCase().includes(qq))
      .slice(0, 50);
  }, [productos, search]);

  const cantidadFinal = tipo === 'AJUSTE' ? cantidad * ajusteSign : cantidad;
  const delta = tipo === 'ENTRADA' ? cantidad : tipo === 'SALIDA' ? -cantidad : cantidadFinal;
  const stockAnterior = producto?.stockActual ?? 0;
  const stockPosterior = stockAnterior + delta;
  const wouldBeNegative = stockPosterior < 0;

  const canSubmit = !!producto && cantidad > 0 && !wouldBeNegative && !registrar.isPending;

  const handleSubmit = () => {
    if (!producto || !canSubmit) return;
    registrar.mutate(
      { productoId: producto.id, tipo, cantidad: cantidadFinal, nota },
      {
        onSuccess: (mov) => {
          onSuccess(`Movimiento registrado · ${producto.nombre}: ${mov.stockAnterior} → ${mov.stockPosterior}`);
          onClose();
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje ?? 'Error al registrar el movimiento';
          onError(msg);
        },
      },
    );
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Registrar movimiento"
      subtitle="Modificá el stock manualmente — queda en el historial con tu usuario."
      width={520}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={!canSubmit}>
            {registrar.isPending ? 'Registrando…' : 'Registrar'}
          </button>
        </>
      }
    >
      <div className="form">

        {/* 1. Producto */}
        <div className="form-section">
          <div className="form-section-title">Producto</div>

          {producto && !searchOpen ? (
            <div className="mov-product-card">
              <div className="mov-product-main">
                <div className="mov-product-name">{producto.nombre}</div>
                <div className="mov-product-meta">
                  {producto.codigo && <span className="mono">{producto.codigo}</span>}
                  {producto.codigo && <span>·</span>}
                  <span className={`chip chip-sm ${producto.categoria === 'LUBRICANTE' ? 'chip-lub' : 'chip-rep'}`}>
                    {producto.categoria === 'LUBRICANTE' ? 'Lub' : 'Rep'}
                  </span>
                  <span>·</span>
                  <span>Stock actual: <strong>{producto.stockActual}</strong></span>
                </div>
              </div>
              <button className="link-btn" onClick={() => { setSearchOpen(true); setSearch(''); }}>
                Cambiar
              </button>
            </div>
          ) : (
            <div className="mov-search">
              <div className="filter-search">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                  <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6" />
                  <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                <input
                  ref={searchInputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre o código…"
                />
              </div>
              <div className="mov-results">
                {productosFiltrados.length === 0 && (
                  <div className="mov-results-empty">Sin resultados</div>
                )}
                {productosFiltrados.map((p) => (
                  <button
                    key={p.id}
                    className="mov-result"
                    onClick={() => { setProductoId(p.id); setSearchOpen(false); }}
                  >
                    <div className="mov-result-main">
                      <div className="mov-result-name">{p.nombre}</div>
                      <div className="mov-result-meta">
                        {p.codigo && <span className="mono">{p.codigo}</span>}
                        {p.codigo && <span>·</span>}
                        <span className={p.stockActual <= p.stockMinimo ? 'text-warn' : ''}>
                          Stock {p.stockActual}
                        </span>
                      </div>
                    </div>
                    <span className={`chip chip-sm ${p.categoria === 'LUBRICANTE' ? 'chip-lub' : 'chip-rep'}`}>
                      {p.categoria === 'LUBRICANTE' ? 'Lub' : 'Rep'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 2-4: only show when product is selected */}
        {producto && (
          <>
            {/* 2. Tipo */}
            <div className="form-section">
              <div className="form-section-title">Tipo de movimiento</div>
              <div className="mov-tipos">
                {TIPOS.map(({ key, label, desc }) => (
                  <button
                    key={key}
                    type="button"
                    className={`mov-tipo${tipo === key ? ' is-active' : ''}`}
                    onClick={() => setTipo(key)}
                  >
                    <div className="mov-tipo-head">
                      <div className={`mov-tipo-icon mov-tipo-icon-${key.toLowerCase()}`}>
                        {key === 'ENTRADA' && (
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                            <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                        {key === 'SALIDA' && (
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                            <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                        {key === 'AJUSTE' && (
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                            <path d="M4 12h16M9 6l-5 6 5 6M15 6l5 6-5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span className="mov-tipo-label">{label}</span>
                    </div>
                    <div className="mov-tipo-desc">{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Cantidad */}
            <div className="form-section">
              <div className="form-section-title">Cantidad</div>
              <div className="mov-qty-row">
                {tipo === 'AJUSTE' && (
                  <div className="seg">
                    <button
                      type="button"
                      className={`seg-btn${ajusteSign === 1 ? ' is-active' : ''}`}
                      onClick={() => setAjusteSign(1)}
                    >
                      <svg viewBox="0 0 24 24" width="11" height="11" fill="none">
                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                      </svg>
                      Suma
                    </button>
                    <button
                      type="button"
                      className={`seg-btn${ajusteSign === -1 ? ' is-active' : ''}`}
                      onClick={() => setAjusteSign(-1)}
                    >
                      <svg viewBox="0 0 24 24" width="11" height="11" fill="none">
                        <path d="M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                      </svg>
                      Resta
                    </button>
                  </div>
                )}

                <div className="mov-qty-input">
                  <button type="button" onClick={() => setCantidad((c) => Math.max(1, c - 1))}>
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none">
                      <path d="M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                    </svg>
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={cantidad}
                    onChange={(e) => setCantidad(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
                  />
                  <button type="button" onClick={() => setCantidad((c) => c + 1)}>
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>

                <div className="mov-qty-quick">
                  {[5, 10, 25].map((n) => (
                    <button key={n} type="button" className="mov-quick-btn" onClick={() => setCantidad(n)}>
                      +{n}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`mov-preview${wouldBeNegative ? ' is-error' : ''}`}>
                <div className="mov-preview-label">Resultado en stock</div>
                <div className="mov-preview-row">
                  <span className="mov-preview-prev">{stockAnterior}</span>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className={`mov-preview-next${wouldBeNegative ? ' is-error' : delta > 0 ? ' is-pos' : delta < 0 ? ' is-neg' : ''}`}>
                    {stockPosterior}
                  </span>
                  <span className="mov-preview-delta">
                    ({delta > 0 ? '+' : ''}{delta})
                  </span>
                </div>
                {wouldBeNegative && (
                  <div className="hint hint-error" style={{ marginTop: 8 }}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                      <path d="M12 9v4M12 17v.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                    El stock no puede quedar negativo.
                  </div>
                )}
              </div>
            </div>

            {/* 4. Nota */}
            <div className="form-section">
              <label className="field">
                <span className="field-label">Nota</span>
                <div className="field-control">
                  <textarea
                    className="input"
                    rows={2}
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    placeholder={NOTA_PLACEHOLDER[tipo]}
                  />
                </div>
              </label>
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
}
