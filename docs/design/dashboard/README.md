# Handoff: Stock API · Dashboard

## Overview
Dashboard ADMIN del sistema de control de stock para un taller mecánico (repuestos y lubricantes). Es la pantalla de aterrizaje post-login y consolida los indicadores principales del negocio: valor de inventario, ventas del período, productos bajo stock mínimo, ventas pendientes, gráfico de ventas de 30 días, lista accionable de reposiciones, últimos movimientos con trazabilidad y top productos del mes.

El backend (Spring Boot + JPA + SQL Server + JWT) ya está especificado en `README.md` y `db-setup.sql` del repo `stock-api`. Este handoff cubre **solo el frontend del Dashboard**.

## About the Design Files
Los archivos de este bundle son **referencias de diseño hechas en HTML/React/Babel inline** — prototipos que muestran el look & feel y el comportamiento esperado, **no código de producción para copiar directamente**.

La tarea es **recrear estos diseños en el stack frontend que tu equipo decida** (recomendado: React + Vite + TypeScript con TanStack Query o Next.js App Router, conectando los endpoints REST que ya define el README del backend). Si no hay un stack definido todavía, elegir el más apropiado y aplicar sus patrones idiomáticos. Los CSS tokens y la estructura de componentes acá descritos son la fuente de verdad visual; los detalles de implementación (cómo organizar fetches, store, routing, etc.) los define el desarrollador.

## Fidelity
**High-fidelity (hifi)** — todos los colores, tipografías, espacios, bordes y comportamientos hover/focus están finalizados. La UI debe recrearse pixel-perfect respetando los tokens y especificaciones de abajo. La librería de componentes la decide el desarrollador (shadcn/ui, Mantine, custom, etc.); lo que NO se debe hacer es perder fidelidad visual al adoptar una librería con opiniones fuertes.

---

## Screens / Views

### 1. Dashboard (única pantalla en este handoff)

**Purpose:** Vista de aterrizaje para el rol ADMIN. Permite ver el estado del negocio de un vistazo y disparar acciones rápidas (nueva venta, reponer stock).

**Layout global:**
- Max-width del contenido: **1440px**, centrado, padding horizontal **28px**, padding vertical **32px arriba / 64px abajo**
- Topbar sticky en la parte superior, altura **60px**, con border-bottom de 1px
- Stack vertical con gap de **28px** entre secciones mayores; gap de **16px** entre grilla interna
- Responsive: a 1100px las grillas colapsan a 1 columna y los KPIs a 2×2

**Estructura vertical del `<main>`:**
1. Page header (título + meta pill de periodo + indicador de sincronía)
2. KPI grid (4 columnas)
3. Grid 1: Sales chart (1.55fr) + Low stock (1fr)
4. Grid 2: Recent movements (1.7fr) + Top products (1fr)
5. Page footer

---

## Components

### Topbar
- **Posición**: sticky, top 0, z-index 50
- **Fondo**: `var(--bg)` con 88% de opacidad + `backdrop-filter: saturate(180%) blur(10px)`
- **Border**: 1px bottom, `var(--border)`
- **Altura**: 60px
- **Grid interno**: `auto 1fr auto`, gap 28px
- **Contenido**:
  - **Brand** (izquierda): cuadrado 32×32px radius 8px con fondo `var(--text)` e ícono SVG de caja en `var(--bg)`. A la derecha: nombre "Stock" (14px / 600) + sub "Taller · Av. Mitre 2340" (11px, muted)
  - **Tabs** (centro): Dashboard, Productos, Movimientos, Ventas (con badge "3" warn), Reportes, Usuarios. Padding 8px 12px, radius 6px, font 13.5px / 500. Activo: color `var(--text)` + underline 2px a `-16px` del bottom. Hover: bg `var(--surface)`
  - **Acciones** (derecha): search box 280px (icono lupa + input + kbd `⌘K`), botón primario "Nueva venta" (icono + a la izquierda), icon button de notificaciones con dot rojo, user chip con avatar circular 26px en accent + nombre "M. Álvarez" + role "ADMIN"

### Page Head
- Flex space-between, wrap, gap 24px, align flex-end
- **Izquierda**:
  - Eyebrow "Resumen" (11px, uppercase, letter-spacing 0.08em, muted, 500)
  - H1 (28px / 600, letter-spacing -0.02em) — saludo personalizado
  - Sub (14px, muted-strong, max-width 560px) — resaltado con `<strong>` en color `var(--text)` 500
- **Derecha** — Meta panel:
  - Fondo `var(--surface)`, border 1px, radius 10px, padding 8px 14px
  - Bloque "Período" con pill dropdown ("Últimos 30 días" + chevron)
  - Divider vertical 1×28px
  - Bloque "Última sincronía" con dot verde animado (pulse 1.8s) + texto

### KPI Cards (×4)
- **Grid**: `repeat(4, 1fr)`, gap 16px
- **Card**:
  - Background `var(--bg-elev)`, border 1px `var(--border)`, radius 12px, padding `18px 18px 14px`
  - Min-height 132px, flex column gap 12px
  - Hover: border `var(--border-strong)`
- **Estructura interna**:
  - Head: label (12.5px muted-strong, 500) + delta pill a la derecha
  - Valor (28px / 600, letter-spacing -0.02em, tabular-nums)
  - Foot (margin-top auto): sub (11.5px muted) + sparkline opcional 90px de ancho
- **Delta pill**: padding 2px 6px, radius 999px, font 11px / 600 tabular. Verde con flecha ↑ (`--success-soft` bg, `--success` text) o rojo con flecha ↓. Variante "flat": gris con texto "—" o "sin cambios"
- **Card warn** (bajo stock): el valor toma color `var(--warn)`
- **Sparkline**: SVG path 1.5px stroke `var(--muted-strong)` o `var(--accent)` con relleno area al 8% si es la card destacada

**Datos exactos del mock:**
- Valor de inventario: `$4.823.450` · +4.2% · sparkline genérica
- Ventas del mes: `$1.247.890` · +18.4% · sparkline accent con fill
- Productos bajo stock: `7` (color warn) · +2 inverse (subir es malo)
- Ventas pendientes: `3` · "sin cambios" (flat)

### Sales Chart
- Card 12px radius con head + chart
- **Head**: título "Ventas · últimos 30 días", sub con total + promedio (formato `$X.XXX.XXX`), seg control 7d/30d/90d (30d activo)
- **Chart**: SVG viewBox `0 0 720 240`, padding interior `padL 44 / padR 16 / padT 16 / padB 28`
- **Eje Y**: 5 líneas horizontales (4 ticks), dashed `2 3` excepto baseline, labels en `var(--muted)` 10px con sufijo `k` para miles
- **Eje X**: labels cada 5 días + último como "Hoy", formato `12 may`, font 10px tabular
- **Línea**: stroke `var(--accent)` 2px, linecap round, linejoin round
- **Área**: gradiente vertical 22% → 0% opacity del accent
- **Hover**: línea vertical dashed + círculo 5px (fill `var(--bg)`, stroke accent 2px) + tooltip negro flotante (`var(--text)` bg, `var(--bg)` text, radius 6px, padding 6px 10px) con fecha (capitalize) y valor

### Low Stock
- Card con head ("Productos bajo stock", sub "N items requieren reposición", link "Ver todos →")
- Lista de **6 productos** ordenados por ratio `stockActual / stockMinimo` ascendente
- **Row**: grid `1fr auto auto`, gap 14px, padding 11px vertical, border-top 1px (la primera sin border)
  - **Main**: nombre del producto (13px / 500, truncate) + meta con 2 chips
    - Chip ghost mono (código, `Geist Mono` 10px, bg `--surface-2`, color muted)
    - Chip categoría: REPUESTO → cyan (`--cat-rep` sobre `--cat-rep-soft`); LUBRICANTE → violet (`--cat-lub` sobre `--cat-lub-soft`)
  - **Right** (text-align right, min-width 110px):
    - Counts: "stockActual" (14px / 600, color warn o critical) + "/ min mín" (11.5px muted)
    - Stock bar 4px altura, fill al porcentaje, color warn/danger
  - **Action**: botón cuadrado 28×28 con `+`
- **Critical threshold**: si `stockActual <= stockMinimo * 0.34` → color danger en counts y barra; sino color warn

### Recent Movements
- Card grande con tabla full-bleed (margin negativo `-4px -18px -18px`)
- Head: título + sub "Trazabilidad en tiempo real" + acciones "Exportar" / "Ver todos →"
- **Tabla** (13px, border-collapse collapse):
  - **Thead**: fondo `--surface`, padding 10px 14px, border top+bottom, text uppercase 11px / 500 letter-spacing 0.04em color muted
  - **Tbody** rows: padding 12px 14px, border-bottom 1px, hover bg `--surface`. Última fila sin border-bottom
- **Columnas** (orden y anchos):
  1. `#` (56px) — ID en Geist Mono 11.5px muted, prefijado con `#`
  2. `Producto` — nombre (13px / 500) + código (Geist Mono 10.5px muted), stack vertical
  3. `Tipo` (110px) — chip ENTRADA / SALIDA / AJUSTE
  4. `Cant.` (90px, right) — con signo `+`/`−`, color verde si pos, rojo si neg
  5. `Stock` (130px, right) — `stockAnterior` (muted) + flecha → + `stockPosterior` (text), tabular
  6. `Usuario` (160px) — avatar circular 22px con iniciales + nombre
  7. `Nota` (140px) — color muted
  8. `Cuando` (100px, right) — "hace N min/h/d", muted
- **Tipo chips**:
  - ENTRADA → verde (`--success-soft` bg + `--success` text), ícono flecha arriba
  - SALIDA → rojo (`--danger-soft` + `--danger`), flecha abajo
  - AJUSTE → neutral (`--surface-2` + `--muted-strong`, border `--border`), línea horizontal
  - Padding 0 8px, altura 20px, font 11px / 500, radius 4px, gap 4px

### Top Products
- Card con head "Más vendidos del mes" + sub "Ordenado por unidades"
- Lista de **5 productos** (no scrolling), gap 12px
- **Row**: grid `auto 1fr auto`, gap 14px
  - Rank `01-05` en Geist Mono 11px muted, width 22px
  - Main: nombre (13px / 500 truncate) + barra horizontal 4px (fill al `vendidos/max * 100%`, accent color)
  - Right: unidades (13px / 600) + revenue (11px muted), tabular, line-height 1.2

### Page Foot
- Flex space-between, padding-top 16px, border-top 1px, font 12px muted

---

## Interactions & Behavior

- **Tab navigation**: solo Dashboard activo. Otros tabs son visualmente accesibles pero en esta release apuntan a sus rutas correspondientes (Productos, Movimientos, Ventas, Reportes, Usuarios)
- **Search ⌘K**: abrir command palette global. No implementado en el prototipo; binding sugerido: `cmd+k` / `ctrl+k`
- **Botón "Nueva venta"**: abre un drawer/modal lateral con flujo POS (fuera de este handoff)
- **Botón notificación con dot**: abre popover con últimas alertas (bajo stock + ventas pendientes)
- **User chip**: abre menú con "Mi cuenta", "Cambiar contraseña", "Cerrar sesión"
- **Meta pill "Últimos 30 días"**: abre date range picker. El rango filtra TODA la dashboard (chart, KPIs, movimientos, top productos)
- **Indicador de sincronía**: polling cada 30s contra `/api/dashboard/sync` (a definir) o WebSocket si está disponible. Si falla 2 veces seguidas → cambiar pulse a color `--warn` y mostrar "desconectado"
- **Seg 7d/30d/90d** del chart: filtra solo el chart, no los demás widgets
- **Sales chart hover**: cursor se mueve sobre el SVG → calcular índice más cercano → mostrar tooltip + crosshair vertical
- **Low stock "+" button**: abre modal "Registrar entrada" con el producto preseleccionado
- **Tabla de movimientos: row hover** = `--surface` bg. Click en row → drawer con detalle completo del movimiento (futuro)
- **"Exportar" en movimientos**: descarga CSV del rango actual

### Animations
- **Pulse del dot verde**: keyframes 1.8s infinite, box-shadow spread 0→6px con color success al 55%→0% opacity
- **Transitions globales**: `.15s` para hover (border-color, background, color, box-shadow). `.3s ease` para anchos de barras de stock
- **Sin animaciones de entrada complejas** — la página renderiza estática; agregar `fade-in 200ms` en el contenedor principal es opcional

### Responsive
- **≤ 1100px**: KPIs → 2×2, grids → 1 columna, search → 200px
- **≤ 720px**: ocultar tabs (mover a hamburger), ocultar user-meta y search, KPIs siguen 2×2, page padding 24px 16px, title 22px

---

## State Management

### Datos requeridos del backend
| Widget | Endpoint sugerido | Notas |
|---|---|---|
| KPI Valor de inventario | `GET /api/reportes/stock` | sum(precioVenta * stockActual) |
| KPI Ventas del mes + chart | `GET /api/reportes/ventas?desde=&hasta=` | dailyBreakdown[] de 30 días |
| KPI Bajo stock + lista | `GET /api/productos/bajo-stock` | filtrar `stockActual <= stockMinimo`, sort por ratio |
| KPI Ventas pendientes | `GET /api/ventas?estado=PENDIENTE` | count |
| Últimos movimientos | `GET /api/movimientos?limit=10` | orden cronológico DESC |
| Top productos | `GET /api/reportes/ventas?...` → `productosMasVendidos[]` | ya viene en el reporte |
| Última sincronía | client-side timestamp del último fetch exitoso | |

### Estado cliente
- `period: { desde: Date, hasta: Date }` — controla todos los widgets
- `chartRange: '7d' | '30d' | '90d'` — local al chart
- `hoveredChartIndex: number | null` — para el tooltip

### Strategy
Usar TanStack Query con `staleTime` 30s. Invalidar todas las queries del dashboard cuando se completa una venta o un movimiento desde otra parte de la app.

---

## Design Tokens

### Colors — Light theme
```css
--bg:            #ffffff;
--bg-elev:       #ffffff;
--surface:       #fafafa;
--surface-2:     #f4f4f5;
--border:        #ececed;
--border-strong: #d4d4d8;
--text:          #09090b;
--text-2:        #3f3f46;
--muted:         #71717a;
--muted-strong:  #52525b;

--accent:        #2563eb;
--accent-2:      #1d4ed8;
--accent-soft:   #eff6ff;
--accent-text:   #ffffff;

--success:       #16a34a;
--success-soft:  #ecfdf5;
--warn:          #b45309;
--warn-soft:     #fef3c7;
--danger:        #dc2626;
--danger-soft:   #fee2e2;

--cat-rep:       #0e7490;
--cat-rep-soft:  #ecfeff;
--cat-lub:       #7c3aed;
--cat-lub-soft:  #f5f3ff;
```

### Colors — Dark theme
```css
--bg:            #09090b;
--bg-elev:       #0c0c0e;
--surface:       #111114;
--surface-2:     #16161a;
--border:        #1d1d22;
--border-strong: #2a2a31;
--text:          #f4f4f5;
--text-2:        #d4d4d8;
--muted:         #8b8b94;
--muted-strong:  #a1a1aa;

--accent:        #3b82f6;
--accent-2:      #60a5fa;
--accent-soft:   rgba(59, 130, 246, 0.14);

--success:       #22c55e;
--success-soft:  rgba(34, 197, 94, 0.14);
--warn:          #eab308;
--warn-soft:     rgba(234, 179, 8, 0.14);
--danger:        #ef4444;
--danger-soft:   rgba(239, 68, 68, 0.14);

--cat-rep:       #22d3ee;
--cat-rep-soft:  rgba(34, 211, 238, 0.10);
--cat-lub:       #a78bfa;
--cat-lub-soft:  rgba(167, 139, 250, 0.12);
```

### Shadows
```css
--shadow-sm:  0 1px 2px rgba(15, 15, 20, 0.04);
--shadow-md:  0 4px 14px rgba(15, 15, 20, 0.06), 0 1px 2px rgba(15, 15, 20, 0.04);
--shadow-lg:  0 12px 36px rgba(15, 15, 20, 0.10), 0 2px 6px rgba(15, 15, 20, 0.06);
/* dark: usar rgba(0,0,0,0.4–0.6) */
```

### Spacing scale (usado en la página)
- `4 6 8 10 12 14 16 18 24 28 32 64` (px)

### Border radius
- `4px` chips
- `6px` botones pequeños, seg items, tabs hover
- `8px` botones, search, icon-btn, marca
- `10px` meta pill panel
- `12px` cards y KPI cards
- `999px` user chip, delta pills

### Typography
- **Font family**: `"Geist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`
- **Font features**: `font-feature-settings: "ss01", "cv11"`
- **Mono**: `"Geist Mono", ui-monospace, "SF Mono", Menlo, monospace` (códigos, IDs, ranks)
- **Tamaños**:
  - 28px / 600 / -0.02em → page H1 + KPI values
  - 14px / 600 → card titles
  - 13.5px / 500 → tabs
  - 13px → body, rows
  - 12.5px / 500 → KPI labels, user-name
  - 12px → card-sub, footer
  - 11.5px → muted text, time
  - 11px / 500 uppercase / 0.04em → table headers, eyebrow (0.08em)
  - 10–10.5px → metas, chart axis, chip text
- **Tabular-nums**: todas las métricas numéricas, IDs, stocks
- **Letter-spacing**: -0.02em en headings grandes, -0.005em en card titles, 0.04em en uppercase

---

## Assets

- **Fuentes**: Google Fonts — Geist (400/500/600/700) + Geist Mono (400/500). Self-host en producción.
- **Íconos**: SVG inline 14–20px, stroke 1.5–2px, `currentColor`, linecap/linejoin round. Reemplazar por una librería tipo **Lucide** o **Tabler Icons** en la implementación real — los íconos son:
  - Caja/cubo (brand)
  - Lupa (search)
  - Plus (nueva venta, reponer)
  - Campana (notificaciones)
  - Chevron-down (meta pill)
  - Flecha-arriba / flecha-abajo (entrada/salida, deltas)
  - Línea horizontal (ajuste)
  - Flecha-derecha (stock anterior→posterior)
- **No hay imágenes** raster en este diseño — todo es SVG/CSS

---

## Files

Bundled in this handoff folder:

```
design_handoff_dashboard/
├── README.md             ← este archivo
├── Dashboard.html        ← entry point del prototipo
└── src/
    ├── styles.css        ← tokens light/dark + todos los component styles
    ├── data.js           ← datos dummy (productos, movimientos, ventasDiarias, KPIs)
    ├── topbar.jsx        ← Topbar con tabs, search, user chip
    ├── kpi-cards.jsx     ← KpiCards + Sparkline + Delta + formatters (fmtARS, fmtNum)
    ├── sales-chart.jsx   ← SalesChart con hover/tooltip
    ├── low-stock.jsx     ← LowStock list
    ├── recent-movements.jsx ← Tabla de movimientos + TipoChip + tiempoRelativo
    ├── top-products.jsx  ← Ranking de productos
    ├── app.jsx           ← composición + theme toggle
    └── tweaks-panel.jsx  ← (panel de tweaks, no es parte de la entrega de producto)
```

Abrir `Dashboard.html` directamente en cualquier navegador moderno o usando un servidor local. No requiere build.

---

## Recommended implementation order

1. **Setup**: tokens en CSS variables o tema de la librería elegida. Implementar `data-theme="light|dark"` toggle al nivel de `<html>` (persistir en localStorage).
2. **Layout shell**: Topbar + Page container responsive.
3. **KPI Cards**: componente reusable que toma `{label, value, delta, sub, spark?}` — bloquear el contrato del DTO desde acá.
4. **Sales Chart**: empezar con D3 scale o Recharts/Visx; reproducir el tooltip custom.
5. **Tablas**: Low Stock y Recent Movements comparten el patrón de chip + tabular-nums. Sacar componentes `<Chip variant>` y `<Tabular>` reutilizables.
6. **Wire data**: conectar a la API real, validar formato de respuesta con Zod.
7. **Estados**: loading skeletons (rectángulos del color de `--surface` con shimmer sutil), empty states, error states con retry.
8. **Tema dark**: verificar que TODOS los componentes funcionan; revisar contraste con WCAG AA.

---

## Notas para Claude Code

- El backend usa **decimales para precios** (DECIMAL(10,2)) — usar `Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })` o equivalente. No usar `Number` directo para montos.
- Los **enums** del modelo (`ADMIN`/`OPERADOR`, `ENTRADA`/`SALIDA`/`AJUSTE`, `PENDIENTE`/`COMPLETADA`/`ANULADA`, `REPUESTO`/`LUBRICANTE`) deben tipearse en TS — generar a partir del OpenAPI/Swagger del backend si es posible (`openapi-typescript`).
- El **JWT** del backend expira a 24h. Implementar refresh o re-login transparente.
- La regla "**stock se descuenta solo al COMPLETAR la venta**" debe quedar clara en la UI: badge PENDIENTE muestra "Stock no descontado aún" en tooltip.
- El rol **OPERADOR** no puede eliminar productos ni anular ventas — esconder esas acciones de la UI, no solo deshabilitarlas. Para el Dashboard específicamente, ambos roles ven lo mismo, pero el saludo y permisos del topbar deben respetar el rol del token.
