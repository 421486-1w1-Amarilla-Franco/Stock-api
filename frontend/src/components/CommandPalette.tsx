import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Users, Receipt, CornerDownLeft, Plus, ArrowLeftRight, Search } from 'lucide-react';
import { useProductos } from '../hooks/useProductos';
import { useClientes } from '../hooks/useTaller';
import { useApp } from '../lib/app-context';
import { fmtARS } from '../lib/format';
import { useDebounced } from '../lib/useDebounced';

interface Item {
  id: string;
  group: string;
  icon: ReactNode;
  label: string;
  meta?: string;
  run: () => void;
}

const PAGES = [
  ['/', 'Inicio'], ['/ventas', 'Ventas'], ['/caja', 'Caja'], ['/clientes', 'Clientes'],
  ['/productos', 'Productos'], ['/movimientos', 'Movimientos'], ['/compras', 'Compras'],
  ['/reportes', 'Reportes'], ['/usuarios', 'Usuarios'],
] as const;

/** Búsqueda global (Ctrl/⌘+K): productos, clientes/patentes, ventas por número y navegación. */
export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { isAdmin, openPos, openMovimiento } = useApp();
  const { data: productos = [] } = useProductos();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const qq = useDebounced(q.trim().toLowerCase(), 150);
  const { data: clientes = [] } = useClientes(qq, qq.length >= 2);

  useEffect(() => {
    if (open) { setQ(''); setSel(0); setTimeout(() => inputRef.current?.focus(), 0); }
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const go = (path: string) => () => { navigate(path); onClose(); };
    const out: Item[] = [];
    if (!qq) {
      out.push(
        { id: 'a-venta', group: 'Acciones', icon: <Plus size={15} />, label: 'Nueva venta', meta: 'F2', run: () => { onClose(); openPos(); } },
        { id: 'a-mov', group: 'Acciones', icon: <ArrowLeftRight size={15} />, label: 'Registrar movimiento de stock', run: () => { onClose(); openMovimiento(); } },
      );
    }
    PAGES.filter(([p]) => p !== '/usuarios' || isAdmin)
      .filter(([, l]) => !qq || l.toLowerCase().includes(qq))
      .forEach(([p, l]) => out.push({ id: 'p' + p, group: 'Ir a', icon: <Search size={15} />, label: l, run: go(p) }));
    if (qq) {
      const num = qq.replace(/^#/, '');
      if (/^\d+$/.test(num)) {
        out.push({ id: 'v' + num, group: 'Ventas', icon: <Receipt size={15} />, label: `Venta #${num}`, run: go(`/ventas?venta=${num}`) });
      }
      productos
        .filter((p) => p.activo && (p.nombre.toLowerCase().includes(qq) || (p.codigo ?? '').toLowerCase().includes(qq)))
        .slice(0, 6)
        .forEach((p) => out.push({
          id: 'pr' + p.id, group: 'Productos', icon: <Package size={15} />, label: p.nombre,
          meta: `${p.codigo ?? ''} · ${p.stockActual} u · ${fmtARS(p.precioVenta)}`, run: go(`/productos/${p.id}`),
        }));
      clientes.slice(0, 5).forEach((c) => out.push({
        id: 'c' + c.id, group: 'Clientes', icon: <Users size={15} />, label: c.nombre,
        meta: c.vehiculos.map((v) => v.patente).join(' · ') || c.telefono, run: go(`/clientes/${c.id}`),
      }));
    }
    return out;
  }, [qq, productos, clientes, isAdmin, navigate, onClose, openPos, openMovimiento]);

  useEffect(() => { setSel(0); }, [qq]);

  if (!open) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); items[sel]?.run(); }
    else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  };

  let lastGroup = '';
  return (
    <div className="palette-backdrop" onClick={onClose}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Buscar" onClick={(e) => e.stopPropagation()}>
        <div className="palette-input">
          <Search size={16} strokeWidth={1.8} aria-hidden="true" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Producto, código, cliente, patente o #venta…"
            aria-label="Buscar"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={items[sel] ? `pal-${items[sel].id}` : undefined}
          />
          <kbd>Esc</kbd>
        </div>
        <ul className="palette-list" id="palette-list" role="listbox">
          {items.length === 0 && <li className="palette-empty">Sin resultados para “{q}”.</li>}
          {items.map((it, i) => {
            const header = it.group !== lastGroup;
            lastGroup = it.group;
            return (
              <li key={it.id} role="presentation">
                {header && <div className="palette-group">{it.group}</div>}
                <div
                  id={`pal-${it.id}`}
                  role="option"
                  aria-selected={i === sel}
                  className={`palette-item${i === sel ? ' is-sel' : ''}`}
                  onMouseMove={() => setSel(i)}
                  onClick={it.run}
                >
                  <span className="palette-icon">{it.icon}</span>
                  <span className="palette-label">{it.label}</span>
                  {it.meta && <span className="palette-meta">{it.meta}</span>}
                  {i === sel && <CornerDownLeft size={13} className="palette-enter" aria-hidden="true" />}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
