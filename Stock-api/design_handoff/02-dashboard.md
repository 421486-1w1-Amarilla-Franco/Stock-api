# Fase 2 · Dashboard

> **Prerequisitos:** Fase 1 completa (shell con topbar, theme toggle, router con 6 rutas).
> **Objetivo:** Implementar la pantalla `/dashboard` completa con KPIs, gráfico de ventas, lista de bajo stock, últimos movimientos y top productos.

Mirá `design_handoff/reference/src/screens-dashboard.jsx` y los componentes que importa (`kpi-cards`, `sales-chart`, `low-stock`, `recent-movements`, `top-products`).

---

## Estructura vertical de la pantalla

1. **Page head** — saludo + meta panel (período + sincronía)
2. **KPI grid** — 4 cards en una fila
3. **Grid 2 columnas** — Sales chart (1.55fr) + Low stock (1fr)
4. **Grid 2 columnas alt** — Recent movements (1.7fr) + Top products (1fr)
5. **Page foot** — métadata (texto en muted)

Gap entre secciones: 28px. Gap interno de grids: 16px.

---

## Componentes

### Page head

```
- Eyebrow "Resumen" (11px UPPER muted)
- H1 dinámico — "Buen día, {nombre}." (28px / 600 / -0.02em)
- Sub: "Llevás N ventas hoy. Tenés N productos bajo stock mínimo."
  - Si N=0 ventas: "Sin ventas registradas hoy todavía."
  - Las cifras en <strong> color text 500

Meta panel a la derecha:
- Card surface, border, radius 10px, padding 8px 14px, flex con divider vertical de 1×28px
- Bloque 1: "Período" (label 10.5px UPPER muted) + pill "Últimos 30 días" + chevron-down
- Bloque 2: "Última sincronía" + dot verde animado (pulse 1.8s) + "hace 12 s"
```

El pulse del dot:
```css
@keyframes pulse {
  0%   { box-shadow: 0 0 0 0 color-mix(in srgb, var(--success) 55%, transparent); }
  70%  { box-shadow: 0 0 0 6px color-mix(in srgb, var(--success) 0%, transparent); }
  100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--success) 0%, transparent); }
}
```

### KPI Cards (4 cards)

| Card | Valor | Sub |
|---|---|---|
| Valor de inventario | `$X.XXX.XXX` | "vs. mes anterior" + delta % |
| Ventas del mes | `$X.XXX.XXX` | "30 días corridos" + delta % + sparkline accent |
| Productos bajo stock | `N` (en color warn) | "≤ stock mínimo" + delta inverse |
| Ticket promedio | `$X.XXX` | "N ventas hoy" + delta % |

**Card:**
- bg `--bg-elev`, border 1px, radius 12px, padding `18px 18px 14px`, min-height 132px
- flex column gap 12px
- Hover: border `--border-strong`

**Estructura interna:**
- Head: label (12.5px muted-strong 500) + delta pill (derecha)
- Valor (28px / 600 / -0.02em, tabular-nums)
- Foot (margin-top auto): sub (11.5px muted) + sparkline opcional (90px ancho)

**Delta pill:**
- Padding 2px 6px, radius 999px, font 11px / 600 tabular
- Verde con ↑ (`--success-soft` bg, `--success` text)
- Rojo con ↓ (`--danger-soft` + `--danger`)
- Inverse: si delta es positivo Y `inverse=true`, se muestra rojo (ej: bajo stock subiendo es malo)
- Sin cambio: bg `--surface-2` con texto "—" o "sin cambios"

**Sparkline:**
- SVG path 1.5px stroke, linecap round
- Para la card de Ventas: stroke `--accent` + relleno area al 8% opacity
- Para otras: stroke `--muted-strong` sin fill

### Sales Chart (componente grande)

Card 12px radius con head + chart SVG.

**Head:**
- Título "Ventas · últimos 30 días" (14px / 600)
- Sub "Total $X · promedio diario $X" (12px muted)
- Seg control 7d/30d/90d a la derecha (radius 8px, padding 2px, items radius 6px). 30d activo por default.

**Chart:**
- SVG viewBox `0 0 720 240`, padding interior `padL 44 / padR 16 / padT 16 / padB 28`
- Eje Y: 5 líneas horizontales (4 ticks). Dashed `2 3` excepto baseline. Labels a la izquierda con sufijo "k" para miles
- Eje X: labels en `[0, 5, 10, 15, 20, 25, 29]` formato `DD MMM` (ej "12 may") + última como "Hoy"
- Línea: stroke `--accent` 2px, linecap+linejoin round
- Área: gradiente vertical 22% → 0% opacity del accent
- Hover (al mover mouse sobre el SVG):
  - Calcular índice más cercano al cursor
  - Línea vertical dashed (`3 3`) entre top y bottom del chart
  - Círculo 5px fill `--bg` stroke accent 2px en el punto
  - Tooltip flotante negro (`var(--text)` bg, `var(--bg)` text, radius 6px, padding 6px 10px) con fecha capitalize + valor en tabular-nums
  - Tooltip tiene flecha hacia abajo (pseudo-element `::after`)

Recomendación: usar D3 scales o **Recharts** para el chart si querés ahorrar tiempo. Si lo hacés con SVG manual, mirá la lógica en `reference/src/sales-chart.jsx`.

### Low Stock Card

```
Head:
- Título "Productos bajo stock"
- Sub "N items requieren reposición"
- Link "Ver todos →" (link-btn — text muted, hover bg surface)

Lista (max 6 items, ordenados por ratio stockActual/stockMinimo ascendente):
- Row grid `1fr auto auto`, gap 14px, padding 11px vertical, border-top 1px
- Main:
  - Nombre 13px / 500, truncate
  - Meta: chip código (mono 10px bg surface-2) + chip categoría
- Right (min-width 110, text-align right):
  - Counts: stockActual (14px / 600, warn o danger) + "/ N mín" (11.5 muted)
  - Stock bar 4px altura, width = ratio*100%, fill warn o danger
- Action button "+" cuadrado 28×28 — llama a callback `onAddStock(productoId)`
  (en esta fase puede ser un console.log; lo conectaremos en Fase 7)

Critical threshold: si stockActual <= stockMinimo * 0.34 → color danger; sino warn.
```

### Recent Movements

Card con tabla "full-bleed" (margin negativo para que la tabla ocupe todo el card).

**Tabla, 8 columnas:**
1. `#` (56px) — `#ID` mono 11.5px muted
2. Producto — nombre + código (stack vertical)
3. Tipo (110px) — chip ENTRADA/SALIDA/AJUSTE
4. Cant. (90px, right) — con signo `+/−`, color verde si pos rojo si neg
5. Stock (130px, right) — `stockAnterior` muted → flecha → `stockPosterior` text
6. Usuario (160px) — avatar circular 22px con iniciales + nombre
7. Nota (140px) — muted
8. Cuando (100px, right) — "hace N min/h/d" muted

**Tipo chips:**
- ENTRADA → verde (`--success-soft` bg + `--success` text), ícono ArrowUp
- SALIDA → rojo (`--danger-soft` + `--danger`), ícono ArrowDown
- AJUSTE → neutral (`--surface-2` + `--muted-strong`, border `--border`), línea horizontal

Tomar últimos 10 movimientos.

### Top Products

Card. Lista de 5 productos del mes, gap 12px.

```
Row grid `auto 1fr auto`:
- Rank 01-05 en mono 11px muted (width 22px)
- Main: nombre 13px / 500 + barra horizontal 4px (fill accent al ratio max)
- Right: unidades (13px / 600) + revenue (11px muted), tabular
```

---

## Datos y endpoints

En esta fase, **usar datos mock locales**. No conectes la API todavía — eso lo hacemos en una fase posterior con todos los endpoints listos.

Hardcodeá los datos del prototipo (mirá `reference/src/data.js` para inspiración). Recomendado: crear `src/mock/data.ts` con typed exports.

**Endpoints reales (para conectar después):**

| Widget | Endpoint |
|---|---|
| KPI Valor inventario | `GET /api/reportes/stock` → sum(precioVenta * stockActual) |
| KPI Ventas mes + chart | `GET /api/reportes/ventas?desde=&hasta=` |
| KPI Bajo stock + lista | `GET /api/productos/bajo-stock` |
| KPI Ticket promedio + count del día | derivado de `/api/ventas` filtrado |
| Últimos movimientos | `GET /api/movimientos?limit=10` |
| Top productos | `GET /api/reportes/ventas?...` → `productosMasVendidos[]` |

Cuando los conectes:
- Usar TanStack Query con `staleTime: 30_000`
- Una query por widget
- Invalidar todas las queries del dashboard cuando se completa una venta o un movimiento desde otra pantalla

---

## Interacciones

- **Tab Dashboard**: ya estás acá, no hace nada
- **Botón "+" de Low Stock**: callback `onAddStock(productoId)` — placeholder por ahora
- **Hover en chart**: tooltip + crosshair vertical
- **Seg 7d/30d/90d**: cambia rango del chart (local al chart, no afecta otros widgets)
- **Meta pill "Últimos 30 días"**: en esta fase visual nada más

---

## Verificación final

- [ ] Dashboard renderiza con datos mock
- [ ] Light + dark se ven correctos
- [ ] Chart tiene hover funcional con tooltip
- [ ] Responsive a 1100px: KPIs → 2×2, grids → 1 columna
- [ ] No hay errores de consola
- [ ] Los formatos de moneda usan `Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })` o similar
