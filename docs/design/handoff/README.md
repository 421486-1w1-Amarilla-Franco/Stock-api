# Handoff · Stock API Frontend

## Cómo usar este handoff

Este paquete está pensado para que pases las instrucciones a Claude Code (u otro asistente de código) **una fase a la vez**, no todo junto. Cada archivo `0X-*.md` es una sesión separada.

**Flujo recomendado:**

1. Abrí Claude Code en la carpeta donde vivirá el frontend (puede ser un subdirectorio del repo `stock-api` o un repo aparte).
2. Empezá con `01-setup.md`. Pegale literalmente el contenido del archivo como prompt.
3. Cuando termine: corré la app, navegá, hacé click. Si algo está raro, pedile ajustes en ese mismo chat.
4. Hacé commit.
5. **Abrí un chat nuevo** y pasale `02-dashboard.md`.
6. Repetí hasta `08-pulido.md`.

**Por qué fases separadas:** Claude Code rinde mejor con contexto fresco y objetivos acotados. Si le pasás todo junto, se olvida detalles del principio y las decisiones malas se propagan.

## Estructura del paquete

```
design_handoff/
├── README.md              ← este archivo
├── 01-setup.md            ← Vite + React + TS, tokens, Topbar, theme toggle, router
├── 02-dashboard.md        ← KPIs, sales chart, low stock, recent movements, top products
├── 03-productos.md        ← Tabla + filtros + drawer crear/editar/baja
├── 04-ventas.md           ← Lista + detalle + crear/eliminar (sin estado pendiente)
├── 05-movimientos.md      ← Tabla con filtros y trazabilidad
├── 06-pos.md              ← Overlay Nueva Venta (carrito + total live)
├── 07-movimiento-manual.md ← Drawer reutilizable para entrada/salida/ajuste
├── 08-pulido.md           ← Toasts, error boundary, placeholders, accesibilidad
├── design-tokens.css      ← Tokens copy-pasteables (light + dark)
└── reference/             ← El prototipo HTML que diseñamos juntos
    ├── Dashboard.html
    └── src/*
```

La carpeta `reference/` tiene el prototipo completo. **No la copies tal cual** — es referencia visual y de comportamiento. Cada fase te dice qué mirar de ahí.

## Sobre el prototipo de referencia

El prototipo está hecho en HTML + React + Babel inline para iterar rápido. Tu implementación debe usar el stack que decidas (recomendado: React + Vite + TypeScript + TanStack Query) y aplicar las convenciones de tu codebase.

**Lo que sí debés respetar pixel-perfect:**
- Tokens (colores, tipografía, espacios, radios) — ver `design-tokens.css`
- Layout y proporciones de cada pantalla
- Estados visuales (hover, active, focus, disabled)
- Microinteracciones (transiciones, animaciones de entrada de drawer/modal)

**Lo que decidís vos:**
- Cómo organizar carpetas, naming convention, routing concreto
- Qué librería de componentes usar (shadcn/ui, Mantine, custom...)
- Cómo manejar estado server (TanStack Query, SWR, Redux Toolkit Query)
- Estado cliente (useState local vs Zustand vs Context)

## Contexto del proyecto

Sistema de control de stock para un taller mecánico. Backend en Spring Boot ya especificado en `stock-api/README.md`. Endpoints REST con JWT auth, roles ADMIN / OPERADOR.

**Entidades principales:**
- `Producto` (REPUESTO | LUBRICANTE)
- `Transaccion` (venta — estados **ACTIVA** | **ELIMINADA**, simplificado del modelo original)
- `Movimiento` (ENTRADA | SALIDA | AJUSTE)
- `Usuario` (ADMIN | OPERADOR)

**Decisiones de producto importantes** (informan toda la UI):

1. **Ventas tienen sólo 2 estados: ACTIVA o ELIMINADA.** No hay estado "pendiente". Al crear una venta, el stock se descuenta de inmediato. Al eliminarla, se devuelve el stock + se generan movimientos ENTRADA con nota "Anulación venta #X". Las eliminadas se ven tachadas en el historial (no se borran del todo — trazabilidad).
2. **Trazabilidad total en movimientos.** Cada cambio de stock guarda `stockAnterior` y `stockPosterior` + usuario que lo hizo. Esto se muestra en la columna Stock como `25 → 24`.
3. **Baja lógica de productos.** Nunca eliminar físicamente — marcar `activo = false`. Productos inactivos siguen apareciendo en filtro "Inactivos" y se pueden restaurar.
4. **Precio congelado en venta.** El detalle de venta guarda `precioUnitario` al momento — si después cambiás el precio del producto, las ventas viejas no se afectan.

## Stack sugerido

```
- Vite + React + TypeScript
- TanStack Query (server state)
- React Router (router)
- Zod (validación de respuestas API)
- Lucide React (iconos — los SVG del prototipo son inline, reemplazar por lucide)
- Geist + Geist Mono (fuentes)
- CSS modules o vanilla CSS con los tokens del handoff (NO Tailwind, los tokens están pensados como CSS variables)
```

## Cómo correr el prototipo de referencia

Abrí `reference/Dashboard.html` en cualquier navegador moderno. No requiere build. Hacé click por todas las pantallas para entender el comportamiento antes de empezar.

Hay un panel "Tweaks" abajo a la derecha para cambiar entre light/dark.
