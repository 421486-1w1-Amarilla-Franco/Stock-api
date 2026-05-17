# Fase 6 · POS (Nueva Venta)

> **Prerequisitos:** Fases 1-5.
> **Objetivo:** Overlay full-screen para crear ventas con buscador, carrito interactivo y validación de stock.

Mirá `design_handoff/reference/src/screens-nueva-venta.jsx`.

Esta es la pantalla **más interactiva** del sistema. Tomate el tiempo de testear los flujos manualmente.

---

## Cuándo se abre

- Click en botón "Nueva venta" del Topbar (cualquier pantalla)
- Click en botón "Nueva venta" del page head de Ventas

Estado debe vivir en el shell (App-level) o en un context para que cualquier pantalla pueda dispararlo.

## Estructura

**Overlay** que cubre toda la pantalla (z-index 110, sobre el topbar):

```
+----------------------------------------+
| HEADER (eyebrow + h2)         [Esc] X  |
+----------------------------------------+
|                              |         |
|   CATÁLOGO (search + grid)   | CART    |
|                              |         |
|                              |         |
|                              | Totales |
+----------------------------------------+
```

Grid: `minmax(0, 1fr) 420px`. Catálogo izquierda, carrito derecha fijo.

### Header

- bg `--bg`, border-bottom 1px, padding 16px 28px
- Izq: eyebrow "Punto de venta" + h2 "Nueva venta"
- Der: kbd "Esc para cancelar" + icon button close

### Catálogo

**Search box (44px de altura, más grande que los normales):**
- bg `--bg`, border 1px, radius 10px, padding 0 14px
- Focus: border accent + box-shadow accent 14%
- Auto-focus al abrir el overlay
- Contador de resultados a la derecha (muted 11.5)

**Grid de productos:**
- `grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))`
- Gap 10px
- Cada card 112px min-height

**Card (botón cliqueable):**

```
- bg --bg, border 1px, radius 10px, padding 12px 12px 10px
- Hover: border accent + box-shadow accent 12% (3px)
- Active (en carrito): border accent + bg accent al 6%
- Out of stock: opacity 0.55, cursor not-allowed, no hover
- Layout: flex column gap 8px
  - Head: chip categoría (Lub/Rep) + código mono 10px muted (truncate)
  - Name: 13px / 500 / line-clamp 2 / flex 1
  - Foot: precio (13.5px / 600) + stock (10.5 muted, "N u." o "Sin stock" en warn si bajo)
- Badge "incart" posicionado en top -6 right -6:
  - Círculo accent con texto "✓ ×N" (font 11 / 600 white, padding 0 7px, radius 999)
```

Filtrado: aplica búsqueda por nombre/código, máx 30 resultados (para no saturar). Solo productos activos.

### Carrito

**Header:**
- bg `--bg`, border-bottom 1px, padding 18px 22px 12px
- "Carrito" + sub "N items"
- Si carrito tiene items: link-btn "Vaciar" a la derecha

**Lista (scroll vertical):**

Si vacío:
- Estado vacío centrado con ícono de carrito 24×24, texto "El carrito está vacío" + "Tocá un producto para agregarlo."

Si hay items, cada línea:

```
Grid `1fr auto auto` gap 10px, padding 10px, radius 8px
- Hover: bg surface
- Si overstock (cantidad > stockActual): bg danger al 6%
- Main:
  - Name 13 / 500 truncate
  - Meta 11 muted flex gap 5: "CODIGO · $X c/u · [Excede stock (N)]"
- Qty pill (stepper):
  - Container 28h, bg surface, border, radius 8px overflow hidden
  - [−] [input centrado 34px] [+]
  - input tipo text inputMode numeric
- Sub:
  - column align flex-end gap 2px
  - $X.XXX bold tabular
  - Botón "remove" minúsculo (×, hover danger)
```

**Footer del carrito:**

```
- bg --bg, border-top 1px, padding 14px 22px 18px, gap 14px
- Observaciones (textarea 2 rows, label uppercase muted)
- Totales:
  - Row "Items" / count en mono
  - Row con border-top dashed:
    - "Total" + $X.XXX en strong 20px 600 tabular
- Si stock issues: hint-error con count
- Botón btn-primary btn-block (height 40):
  - "Registrar venta" + ícono ArrowRight
  - Disabled si carrito vacío O hay stockIssues
```

## Lógica del carrito

```ts
type CartItem = { productoId: number; cantidad: number };

addToCart(productoId) {
  // si ya existe, incrementar; sino, push con cantidad: 1
}
updateQty(productoId, delta) {
  // si quedaría en 0, remove
}
setQty(productoId, qty) {
  // qty debe ser entero >= 0
}
```

Cada line calcula `subtotal = precioVenta * cantidad` al render — el cliente NO guarda el precio (eso lo hace el backend al crear).

## Stock issues

Iterar el carrito y marcar cada línea cuya `cantidad > producto.stockActual` como issue. Mostrarlas inline (en la meta de la línea) + un resumen al pie ("N productos sin stock suficiente"). El botón Registrar se desactiva si hay alguno.

## Submit

Al click "Registrar venta":

```ts
mutation.mutate({
  observaciones,
  detalles: cart.map(it => ({ productoId: it.productoId, cantidad: it.cantidad })),
})

// onSuccess:
//   - invalidar queries: ['productos'], ['ventas'], ['movimientos'], ['kpis']
//   - toast.success("Venta #X registrada · N productos · $XXX")
//   - cerrar overlay
//   - reset state interno

// onError (ej: stock insuficiente del backend):
//   - toast.error con el mensaje
```

POST `/api/ventas` body:
```json
{
  "observaciones": "Cliente: Honda Civic 2018",
  "detalles": [
    { "productoId": 1, "cantidad": 1 },
    { "productoId": 4, "cantidad": 1 }
  ]
}
```

El backend automáticamente:
- Calcula `precioUnitario` desde el producto al momento
- Calcula `subtotal` y `total`
- Descuenta stock
- Crea movimientos SALIDA

## Animaciones

```
- Overlay aparece: opacity 0 + translateY 8 → 1 + 0 en .28s cubic-bezier(0.22, 1, 0.36, 1)
- Cerrar con Esc o click en X
- Lock scroll del body cuando está abierto
```

---

## Verificación

- [ ] Click "Nueva venta" abre overlay
- [ ] Search auto-focus, filtrar productos en vivo
- [ ] Click card lo agrega; click de nuevo incrementa
- [ ] +/- y editar input cambian la cantidad correctamente
- [ ] Total se actualiza en vivo
- [ ] Validación stock: si pongo más cantidad que stock disponible, la línea se pone roja y el botón se desactiva
- [ ] Cancelar/Cerrar resetea el state
- [ ] Crear venta → cierra overlay + toast + dashboard ya muestra stock actualizado
- [ ] Esc cierra
