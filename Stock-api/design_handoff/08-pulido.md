# Fase 8 · Pulido + Cross-cutting

> **Prerequisitos:** Fases 1-7 completas.
> **Objetivo:** Cerrar cabos sueltos. Sistema de toasts, error boundary, placeholders para Reportes/Usuarios, accesibilidad básica, performance.

---

## 1. Sistema de toasts

Mirá `design_handoff/reference/src/toasts.jsx`.

**Decisión de stack:** podés usar [Sonner](https://sonner.emilkowal.ski/), [react-hot-toast](https://react-hot-toast.com/) o hacerlo a mano. Si lo hacés a mano:

- Container fijo bottom 24 right 24, z-index 100, flex column gap 8
- Toast: bg `--bg`, border, radius 10, padding 12 14, shadow-lg, min-width 280, max-width 420
- Animación entrada: `translateX(20)` → 0 + opacity 0 → 1 en .25s
- Layout: ícono 26×26 circular + body (title 13/500 + desc 12 muted) + close button minúsculo
- Auto-dismiss en 4.2s
- Variantes:
  - success: ícono check, bg success-soft + color success
  - error: ícono alert, bg danger-soft + color danger
  - info: ícono info, bg accent-soft + color accent

**Adoptarlo en toda la app** — toda mutation success/error debería emitir un toast. Ejemplos:

| Acción | Tipo | Texto |
|---|---|---|
| Producto creado | success | "Producto creado · Stock inicial: N" |
| Producto actualizado | success | "{nombre} actualizado" |
| Producto dado de baja | info | "{nombre} dado de baja" |
| Venta creada | success | "Venta #N registrada · N productos · $X" |
| Venta eliminada | info | "Venta #N eliminada · Stock restaurado en N productos" |
| Movimiento creado | success | "Movimiento registrado · {producto}: prev → next" |
| Stock insuficiente | error | "Stock insuficiente · {producto} — disponible N, requerido M" |
| Error API genérico | error | con el mensaje del backend |

## 2. Error Boundary

```tsx
class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error(error, info); }
  reset = () => this.setState({ error: null });
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="error-fallback">
        <div className="error-card">
          <div className="error-icon"><AlertTriangleIcon/></div>
          <div className="error-title">Algo salió mal en esta pantalla</div>
          <div className="error-desc"><code>{String(this.state.error.message)}</code></div>
          <button onClick={this.reset}>Volver a intentar</button>
        </div>
      </div>
    );
  }
}
```

Envolver el Shell entero. También considerar boundaries más chicos por pantalla para que un crash en una pantalla no funda todo.

## 3. Placeholders para Reportes y Usuarios

Mirá `design_handoff/reference/src/screens-placeholder.jsx`.

Pantalla con un card grande dashed-border que dice "Próximamente" + lista de bullets con check verde describiendo qué va a tener cada sección. **No es relleno** — es explicación honesta al usuario de qué se viene.

### Reportes
- Reporte de ventas por rango de fechas
- Valor de inventario actual y proyección
- Ranking de productos más vendidos por unidades e ingresos
- Comparativa mes a mes y export a CSV/PDF

### Usuarios
- Listado de usuarios activos con su rol (ADMIN / OPERADOR)
- Crear, editar y deshabilitar cuentas
- Reseteo de contraseña y auditoría de accesos
- Permisos granulares por endpoint

## 4. Loading states

Para cada query con `isLoading`, mostrar un **skeleton** sutil (rectángulos del color de `--surface` con shimmer leve), no un spinner.

```css
.skeleton {
  background: linear-gradient(90deg, var(--surface) 0%, var(--surface-2) 50%, var(--surface) 100%);
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
  border-radius: 6px;
}
@keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
```

- KPI cards: skeleton del valor (height 28px width 70%)
- Tablas: 8 filas de skeleton
- Chart: rectángulo de 240px de altura

## 5. Error states de queries

Cuando `query.isError`, mostrar dentro del card un mini-error con:
- Ícono alert rojo
- Mensaje del error
- Botón "Reintentar" que llame a `query.refetch()`

## 6. Empty states

Ya cubierto por pantalla pero unificar el componente:

```tsx
<EmptyState
  icon={<SearchX/>}
  title="Sin resultados"
  description="Probá otro filtro o término de búsqueda."
/>
```

## 7. Accesibilidad

- [ ] Todos los buttons sin texto visible tienen `aria-label`
- [ ] Drawer y modal: `role="dialog" aria-modal="true"` + focus trap
- [ ] Esc cierra drawers, modals y el POS overlay (ya implementado en cada uno)
- [ ] Tabla: `<th>` con `scope="col"`, filas clickables con `role="button"` y manejar Enter/Space
- [ ] Contraste verificado WCAG AA en light y dark (especialmente el muted sobre surface)
- [ ] Iconos puramente decorativos: `aria-hidden="true"`

## 8. Permisos / rol OPERADOR

El rol OPERADOR no puede:
- Eliminar productos (botón trash no aparece en la fila)
- Eliminar ventas (botón "Eliminar venta" no aparece en el drawer detalle)
- Acceder a la pestaña Usuarios (redirect a /dashboard si entra a /usuarios)

Usar un hook `useUser()` o context que exponga el rol. Patron:

```tsx
const { rol } = useUser();
const canDeleteProducto = rol === "ADMIN";
```

**No deshabilitar visualmente** los botones — **esconderlos directamente**. La UI no debe sugerir capacidades que el usuario no tiene.

## 9. Format helpers

Centralizar en `src/utils/format.ts`:

```ts
export const fmtARS = (n?: number) =>
  "$" + (n ?? 0).toLocaleString("es-AR", { maximumFractionDigits: 0 });

export const fmtNum = (n?: number) => (n ?? 0).toLocaleString("es-AR");

export const fmtDateTime = (iso: string) => {
  const d = new Date(iso);
  const date = d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" }).replace(".", "");
  const time = d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time}`;
};

export const tiempoRelativo = (iso: string) => {
  const d = new Date(iso).getTime();
  const now = Date.now();
  const diffMin = Math.round((now - d) / 60000);
  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `hace ${diffH} h`;
  return `hace ${Math.round(diffH / 24)} d`;
};
```

## 10. Polling / live updates

El dashboard idealmente se actualiza solo. Opciones:

- **Polling:** TanStack Query con `refetchInterval: 30_000` en las queries del dashboard
- **WebSocket:** si el backend lo soporta (recomendado pero más complejo)

Para v1 el polling 30s alcanza. Indicador visual "Última sincronía hace 12 s" se actualiza con `useEffect + setInterval`.

---

## Verificación final del proyecto

- [ ] Todas las pantallas tienen loading, error y empty states
- [ ] Toasts cubren todas las mutations
- [ ] Error boundary previene white screens
- [ ] Dark mode revisado en todas las pantallas
- [ ] Permisos OPERADOR esconden acciones de ADMIN
- [ ] Sin errores ni warnings en consola
- [ ] Lighthouse score razonable (>90 en perf y a11y)
- [ ] Build pesa bien (`npm run build` y revisar el bundle)
