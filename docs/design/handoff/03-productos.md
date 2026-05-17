# Fase 3 · Productos

> **Prerequisitos:** Fase 1 + Fase 2.
> **Objetivo:** Pantalla `/productos` con tabla densa, filtros, búsqueda, ordenamiento, drawer para crear/editar, y baja lógica con confirmación.

Mirá `design_handoff/reference/src/screens-productos.jsx`.

---

## Estructura

```
1. Page head: eyebrow "Catálogo" + h1 "Productos" + sub con counts + actions (Exportar + Nuevo producto)
2. Filterbar: search + seg de filtro (Activos/Bajo stock/Inactivos) + seg de categoría (Todas/Repuestos/Lubricantes)
3. Card con tabla
4. Drawer crear/editar (a la derecha, 520px de ancho)
5. Modal de confirmación para baja
```

## Filterbar

Componente compartido (vamos a reusarlo en Movimientos y Ventas):

```css
.filterbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
```

- **Search box** (340px de ancho, h 36px, similar al search del topbar pero con bg `--bg-elev`)
- **Seg control** (un grupo por filtro):
  - Container: bg `--surface`, border, radius 8px, padding 2px
  - Botón activo: bg `--bg`, shadow-sm, border
  - Cada botón puede tener un count chip a la derecha (`seg-count`): pill diminuta bg surface-2, mono tabular
  - Variante warn: para "Bajo stock" el count va en bg warn-soft + color warn

## Tabla de productos

**Card "no-pad"** (sin padding interno; la tabla ocupa todo el card y tiene un footer al final con el count).

**Columnas:**

| Columna | Width | Notas |
|---|---|---|
| Producto | flex | nombre + código mono debajo (stack) — sortable por `nombre` |
| Categoría | 130 | chip cyan (Repuesto) o violet (Lubricante) — sortable |
| P. costo | 120 right | `$X.XXX` muted — sortable |
| P. venta | 130 right | `$X.XXX` bold + chip "XX%" margen al lado (surface-2) — sortable |
| Stock | 130 right | `stockActual` / "stockMinimo mín" muted — sortable |
| Estado | 110 | `status-chip` (ver abajo) |
| (acciones) | 60 | botón ícono trash/restore |

**Status chip (StockBadge):**

| Caso | Label | Estilo |
|---|---|---|
| `!activo` | "Inactivo" | surface-2 + muted-strong |
| `stockActual === 0` | "Sin stock" | danger-soft + danger |
| `stockActual <= stockMinimo * 0.34` | "Crítico" | danger-soft + danger |
| `stockActual <= stockMinimo` | "Bajo" | warn-soft + warn |
| else | "OK" | success-soft + success |

**Comportamiento:**
- Click en row → abre drawer en modo edición
- Click en columna ordenable → toggle asc/desc, con flecha al lado del label (opacity 0.3 sin sort, 1.0 activo)
- Click en botón trash → modal de confirmación → si confirma, `deleteProducto` (baja lógica, `activo: false`)
- Producto inactivo: botón cambia a "Restore" (ícono RotateCcw verde), click → reactiva sin confirmación
- Click en celda de "Producto" cuando el row es clickable: se debe propagar al click del row (no stopPropagation)
- Click en botón de acciones: `e.stopPropagation()` para que NO abra el drawer

**Empty state:**
Si la lista filtrada está vacía:
```
<tr><td colSpan="7" className="empty-state">
  <div className="empty-title">Nada por acá</div>
  <div className="empty-sub">Ajustá los filtros o creá un producto nuevo.</div>
</td></tr>
```
Padding 56px 16px, text-align center.

**Table footer:**
- bg `--surface`, border-top 1px, padding 10px 18px, font 12px muted
- "N de M productos"

## Drawer crear/editar

**Drawer reusable** (mirá `reference/src/ui.jsx`):
- Backdrop semi-transparente con fade
- Panel a la derecha, ancho 520px, slide-in con cubic-bezier `(0.22, 1, 0.36, 1)` en .25s
- Header con title + subtitle + close button
- Body scrollable
- Footer con botones (right-aligned)
- Cerrar con Esc o click en backdrop
- Lock scroll del body cuando está abierto

**Form interno (3 secciones con título uppercase):**

### Sección "Datos básicos"
- `nombre` (input text, required) — label "Nombre" con asterisco rojo
- Row 2 cols:
  - `codigo` (input mono — `font-family: Geist Mono, font-size: 12.5px`)
  - `categoria` — seg control full-width (Repuesto/Lubricante)
- `descripcion` (textarea 2 rows)

### Sección "Precios"
- Row 2 cols:
  - `precioCosto` (input number, prefix "$")
  - `precioVenta` (input number, prefix "$")
- **Margin pill** debajo (si precioCosto > 0):
  - Self-align flex-start
  - Background surface, border, radius 8px, padding 6px 12px
  - "Margen <strong>XX.X%</strong>"
  - Strong en color `--success` si >= 20%, `--warn` si < 20%

### Sección "Stock"
- Row 2 cols: `stockActual`, `stockMinimo` (ambos number, min 0)
- Hint warn si `stockActual <= stockMinimo`: "Este producto quedará marcado como bajo stock." (icono + texto en hint-warn)

### Inputs

```css
.input {
  width: 100%;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 9px 12px;
  font-size: 13.5px;
}
.input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 16%, transparent);
}
```

Prefix "$" para currency: position absolute a la izquierda, padding-left 26px en el input.

### Footer del drawer

- "Cancelar" (btn-ghost) + "Guardar cambios" o "Crear producto" (btn-primary)
- En edit mode, además un botón "Ajustar stock" abajo a la izquierda con `marginRight: auto` (lo vamos a conectar en Fase 7 — por ahora, deshabilitado o sólo visual)

## Modal de confirmación

Componente reusable (`<ConfirmModal>`):
- Backdrop centered grid place-items
- Card 440px max, radius 14px, padding 24px, shadow-lg
- Animación entrada: scale 0.96 → 1 + opacity 0 → 1 en .18s
- Header: ícono cuadrado 40×40 (radius 10px) en `danger-soft + danger` para confirmaciones destructivas, `accent-soft + accent` para neutrales + título + descripción
- Footer right-aligned: Cancelar (ghost) + Confirmar (primary o danger)
- Cerrar con Esc

**Texto para baja de producto:**
- Title: "Dar de baja producto"
- Description: `"{nombre}" quedará marcado como inactivo. Podés reactivarlo después.`
- Confirm label: "Dar de baja" (botón rojo)

---

## API endpoints

| Acción | Endpoint |
|---|---|
| Listar | `GET /api/productos` (activos por defecto) — usar `?incluirInactivos=true` o filtrar client-side |
| Por categoría | `GET /api/productos/categoria/{REPUESTO|LUBRICANTE}` |
| Bajo stock | `GET /api/productos/bajo-stock` |
| Crear | `POST /api/productos` con body del form |
| Actualizar | `PUT /api/productos/{id}` |
| Baja | `DELETE /api/productos/{id}` (baja lógica server-side) |
| Restaurar | `PUT /api/productos/{id}` con `{activo: true}` (revisar con backend) |

Usar TanStack Query. Después de crear/editar/eliminar, invalidar la query `["productos"]`.

---

## Verificación

- [ ] Lista renderiza, filtros + sort funcionan
- [ ] Click en row abre drawer poblado
- [ ] Drawer crear funciona — cierra con Esc + valida nombre required
- [ ] Modal de confirmación para baja
- [ ] Margen se calcula en vivo en el form
- [ ] Status chips correctos para cada caso (OK / Bajo / Crítico / Sin stock / Inactivo)
- [ ] Empty state cuando no hay resultados
- [ ] Toggle inactivo: botón cambia a Restore
