# Fase 1 · Setup + Shell

> **Prerequisitos:** ninguno. Esta es la primera fase.
> **Objetivo:** Tener un proyecto que arranca, con el shell visual (Topbar + área de contenido), tema light/dark funcional, y router básico con 6 rutas vacías (Dashboard, Productos, Movimientos, Ventas, Reportes, Usuarios).

---

## Stack a usar

```
- Vite + React + TypeScript
- React Router v6+ (browser router)
- TanStack Query (instalado pero sin usar todavía — lo conectamos en Fase 2)
- Zod (para validación de respuestas API — sin usar todavía)
- Lucide React (íconos)
- Fuentes: Geist + Geist Mono via Google Fonts
- CSS plain con CSS variables (NO Tailwind). Los tokens están en design-tokens.css
```

## Pasos

### 1. Init del proyecto

```bash
npm create vite@latest . -- --template react-ts
npm install
npm install react-router-dom @tanstack/react-query zod lucide-react
```

### 2. Configurar fuentes

En `index.html`, antes de `</head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### 3. Tokens globales

Copiá el contenido de `design_handoff/design-tokens.css` a tu hoja de estilos global (`src/styles/tokens.css` o donde te quede cómodo). Importalo en `src/main.tsx`.

### 4. Theme toggle

Implementá un hook `useTheme()` que:
- Lee preferencia inicial de `localStorage` (key: `stock-theme`, valores: `"light" | "dark"`)
- Si no hay nada guardado, default a `"light"`
- Aplica `document.documentElement.dataset.theme = theme` cada vez que cambia
- Persiste en localStorage al cambiar

El toggle visual va en el menú de usuario del Topbar (todavía no funcional — en esta fase basta con un botón en cualquier lado para verificar que funciona).

### 5. Topbar

Mirá `design_handoff/reference/src/topbar.jsx` para la estructura visual exacta.

**Layout:**
- `<header>` sticky top, z-index 50, altura 60px
- Fondo: `var(--bg)` al 88% + `backdrop-filter: saturate(180%) blur(10px)`
- Border-bottom 1px `var(--border)`
- Grid interno: `auto 1fr auto`, gap 28px, max-width 1440px, padding horizontal 28px

**Contenido (de izquierda a derecha):**

1. **Brand** — cuadrado 32×32 radius 8px con fondo `var(--text)` e ícono "Package" de Lucide en `var(--bg)`. A la derecha: nombre "Stock" (14px / 600) + sub "Taller · Av. Mitre 2340" (11px, muted)

2. **Tabs** (NavLink de React Router) — 6 tabs: Dashboard, Productos, Movimientos, Ventas, Reportes, Usuarios
   - Padding 8px 12px, radius 6px, font 13.5px / 500, color `var(--muted-strong)`
   - Hover: bg `var(--surface)`, color `var(--text)`
   - Activo: color `var(--text)` + underline 2px abajo del tab a `-16px` (usar `::after`)

3. **Acciones** (derecha):
   - Search box (280px de ancho, h 34px, radius 8px, bg `var(--surface)` con borde) — placeholder "Buscar producto, código, venta…" + kbd "⌘K" (en esta fase sólo visual, sin handler)
   - Botón primario "Nueva venta" con ícono Plus (en esta fase: navegar a `/ventas` o no hacer nada)
   - Icon button de campana de notificación con un dot rojo (visual)
   - User chip: avatar circular 26px con iniciales "MA" en accent, nombre "M. Álvarez" + role "ADMIN" en 10px muted

### 6. Router

Rutas a configurar (todas con shell común — `<Outlet/>` debajo del Topbar):

```
/                → redirect a /dashboard
/dashboard       → <Dashboard/>   (placeholder por ahora)
/productos       → <Productos/>   (placeholder)
/movimientos     → <Movimientos/> (placeholder)
/ventas          → <Ventas/>      (placeholder)
/reportes        → <Reportes/>    (placeholder)
/usuarios        → <Usuarios/>    (placeholder)
```

Cada placeholder por ahora puede ser un `<main className="page"><h1>Nombre de la pantalla</h1></main>`.

### 7. Layout de página

Definí una clase global `.page`:

```css
.page {
  max-width: 1440px;
  margin: 0 auto;
  padding: 32px 28px 64px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}
```

### 8. Responsive

```
@media (max-width: 1100px) → search input se achica a 200px
@media (max-width: 720px)  → ocultar tabs, ocultar user-meta, ocultar search; padding de page a 24px 16px
```

### 9. Verificación final antes de cerrar la fase

Antes de hacer commit, confirmá que:

- [ ] La app arranca con `npm run dev` sin errores en consola
- [ ] Las 6 rutas navegan correctamente con el Topbar manteniéndose
- [ ] El tab activo se ve subrayado
- [ ] Cambiar de light a dark se ve bien (todos los colores tienen contraste razonable)
- [ ] Refrescá la página → recuerda el theme
- [ ] A 720px el layout sigue siendo usable
- [ ] **No hay scroll horizontal** del body en ningún viewport (probar 1440, 1280, 1100, 900). Aplicar `overflow-x: clip` en `html, body` como red de seguridad, y `min-width: 0` en grids y flex children que tengan `white-space: nowrap` por dentro.

---

## Notas adicionales

- **No instalar Tailwind ni ningún design system tipo MUI/Chakra.** Los tokens están pensados como CSS variables puras.
- **Usar Lucide React para los íconos** (`Package`, `Plus`, `Bell`, `Search`, etc.). El prototipo usa SVG inline porque es HTML estático; en tu app preferimos Lucide.
- **TypeScript estricto.** Activar `strict: true` en `tsconfig.json`.
- **Tipos compartidos:** crear `src/types/api.ts` con los enums del backend (vacíos por ahora, los llenamos en Fase 2):
  ```ts
  export type Rol = "ADMIN" | "OPERADOR";
  export type Categoria = "REPUESTO" | "LUBRICANTE";
  export type TipoMovimiento = "ENTRADA" | "SALIDA" | "AJUSTE";
  export type EstadoVenta = "ACTIVA" | "ELIMINADA";
  ```

## Mock de auth para esta fase

No implementes login real todavía. Hardcodeá el usuario en un context o store:

```ts
{ id: 1, nombre: "M. Álvarez", iniciales: "MA", rol: "ADMIN" }
```

Lo conectamos a `/api/auth/login` en una fase posterior cuando definamos toda la auth.
