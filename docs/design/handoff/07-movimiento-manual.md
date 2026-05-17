# Fase 7 · Movimiento Manual (Drawer Reusable)

> **Prerequisitos:** Fases 1-6.
> **Objetivo:** Un drawer reusable para registrar entradas, salidas y ajustes manuales de stock. Triggerable desde 3 lugares distintos.

Mirá `design_handoff/reference/src/movimiento-drawer.jsx`.

---

## Triggers (dónde se abre)

| Lugar | Pre-fill | Tipo default |
|---|---|---|
| Botón "+" de cada fila en **Bajo Stock** del Dashboard | producto ya seleccionado | ENTRADA |
| Botón "Registrar movimiento" en pantalla **Movimientos** | nada | ENTRADA |
| Botón "Ajustar stock" en el drawer de edición de **Producto** | producto ya seleccionado | AJUSTE |

Igual que el POS, el state vive en App-level. Expone un callback `openMovimiento(productoId?, tipo?)`.

---

## Estructura del drawer

Drawer estándar de 520px ancho. Header + body + footer.

**Header:**
- Title: "Registrar movimiento"
- Subtitle: "Modificá el stock manualmente — queda en el historial con tu usuario."

**Body con 4 secciones:**

### 1. Producto

Tiene 2 estados:

**(a) Sin producto seleccionado** (o el usuario clickeó "Cambiar"):
- Mostrar search box (igual al de Productos)
- Debajo, lista de resultados (max 50, ya filtrados activos):
  - Container border + radius 10px + max-height 260 scroll
  - Cada result: padding 10px 12px, border-bottom (último sin), hover surface
  - Layout flex space-between: main (nombre + meta) + chip cat
  - Meta: "CODIGO · Stock N" — si bajo stock, "Stock N" en `--warn` 500
  - Click en result → setea producto y cierra search

**(b) Producto seleccionado:**
- Card bg surface, border, radius 10px, padding 12px 14px
- Main: nombre 13.5 / 500 + meta ("CODIGO · chip Lub/Rep · Stock actual: <strong>N</strong>")
- Link "Cambiar" a la derecha

Al abrir el drawer:
- Si vino con `prefillProductoId` → estado (b), search cerrado
- Si vino sin → estado (a) con search auto-focus

### 2. Tipo de movimiento

3 cards apiladas (grid 1 col), una por tipo:

```
- Card bg --bg, border, radius 10px, padding 12px 14px
- Hover: border --border-strong
- Active: border accent + bg accent al 6%
- Head: ícono 24×24 cuadrado radius 6px (con bg + color por tipo) + label 13 / 600
- Desc 12px muted
```

| Tipo | Ícono | Color | Description |
|---|---|---|---|
| ENTRADA | ArrowUp | success-soft + success | "Compra, devolución de cliente, reposición de proveedor." |
| SALIDA | ArrowDown | danger-soft + danger | "Consumo interno, rotura, pérdida o uso en taller sin venta." |
| AJUSTE | DiffIcon (líneas con flechas) | surface-2 + muted-strong | "Corrección por inventario físico o discrepancia detectada." |

### 3. Cantidad

Layout: `flex gap 12 wrap`

- **Si tipo === AJUSTE**: seg con 2 botones "Suma" (icon +) / "Resta" (icon −). Default: Suma.
- **Stepper:** [−] [input 56×36] [+]
  - Container 36h, bg `--bg`, border, radius 8 overflow hidden
  - Botones 30px, no border, hover surface
  - Input: width 56, text-center, font-weight 600 / 14, tabular, hide spinner buttons (`-webkit-appearance: none`)
  - min: 1, valor entero positivo siempre
- **Quick buttons:** "+5" "+10" "+25" (chips clickables que setean cantidad directamente)

**Preview en vivo (debajo):**

```
- Card surface, border, radius 10, padding 14, gap 6, flex column
- Label "Resultado en stock" (uppercase 11 muted)
- Row flex gap 8 align-center tabular:
  - stockAnterior 20px / 500 muted
  - flecha → muted
  - stockPosterior 24px / 700 letter-spacing -0.01em
  - Color del stockPosterior según signo del delta:
    - delta > 0: --success
    - delta < 0: --warn
    - delta === 0: --text
  - (+N) o (−N) en 12 muted al lado
```

Si `stockPosterior < 0`:
- Card cambia a bg `--danger-soft`, border `--danger` al 30%
- stockPosterior en `--danger`
- Aparece hint-error abajo: "El stock no puede quedar negativo."
- Botón "Registrar" disabled

### 4. Nota (textarea)

Label "Nota", placeholder dinámico según tipo:
- ENTRADA: "Ej: OC 2026-042, devolución cliente…"
- SALIDA: "Ej: Rotura, uso interno…"
- AJUSTE: "Ej: Inventario físico, diferencia detectada…"

---

## Footer del drawer

- "Cancelar" (ghost) + "Registrar" (primary)
- Disabled si no hay producto seleccionado, cantidad <= 0, o stockPosterior < 0

## Submit

```ts
POST /api/movimientos
body: {
  productoId,
  tipo: "ENTRADA" | "SALIDA" | "AJUSTE",
  cantidad: number,    // siempre absoluta para ENTRADA/SALIDA
                       // signada para AJUSTE (positiva = suma, negativa = resta)
  nota: string,
}
```

Backend valida stock no negativo + actualiza producto + retorna el movimiento creado con stockAnterior/Posterior.

**onSuccess:**
- Invalidate `["productos"]`, `["movimientos"]`, `["kpis"]`
- Toast.success "Movimiento registrado · NombreProducto: N → M"
- Cerrar drawer

---

## Conexión con triggers

### Desde Low Stock card (Fase 2)

Pasar prop `onAddStock={(productoId) => openMovimiento(productoId, "ENTRADA")}` al `<LowStock/>`.

### Desde pantalla Movimientos (Fase 5)

Botón "Registrar movimiento" en page actions → `openMovimiento()` (sin prefill).

### Desde drawer de Producto (Fase 3)

En el footer del drawer de Producto (solo en modo edit), botón "Ajustar stock" abajo a la izquierda:

```tsx
<button
  className="btn btn-ghost"
  style={{ marginRight: "auto" }}
  onClick={() => {
    closeProductoDrawer();
    openMovimiento(producto.id, "AJUSTE");
  }}
>
  <Icon name="diff" /> Ajustar stock
</button>
```

---

## Verificación

- [ ] Botón "+" en Low Stock abre drawer con producto preseleccionado + tipo ENTRADA
- [ ] "Registrar movimiento" en Movimientos abre drawer vacío con search auto-focus
- [ ] "Ajustar stock" en producto cierra ese drawer y abre el de movimiento con AJUSTE
- [ ] Cambiar tipo cambia label del ícono y descripción
- [ ] AJUSTE muestra toggle Suma/Resta
- [ ] Preview en vivo refleja delta
- [ ] Quick buttons +5/+10/+25 setean cantidad
- [ ] Validación stock negativo: preview rojo + botón disabled
- [ ] Tras Registrar: drawer cierra + toast + dashboard refleja cambio
