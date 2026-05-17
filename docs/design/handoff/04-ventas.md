# Fase 4 · Ventas

> **Prerequisitos:** Fases 1-3.
> **Objetivo:** Pantalla `/ventas` con lista filtrable, drawer de detalle con líneas, y eliminación con devolución de stock.

Mirá `design_handoff/reference/src/screens-ventas.jsx`.

---

## Modelo de venta — decisión importante

**Las ventas tienen solo 2 estados:**
- `ACTIVA` — venta vigente, stock ya descontado
- `ELIMINADA` — anulada, stock fue devuelto al inventario

**NO hay estado "PENDIENTE".** Si el backend usa `COMPLETADA` / `ANULADA` / `PENDIENTE`, mapealo así:
- COMPLETADA → ACTIVA
- ANULADA → ELIMINADA
- PENDIENTE → no debería ocurrir en este modelo (verificar con backend, posiblemente eliminar de los enums)

**Al crear:** stock se descuenta inmediatamente, se generan movimientos SALIDA automáticos.
**Al eliminar:** stock vuelve, se generan movimientos ENTRADA con nota "Anulación venta #X". La venta queda en el historial tachada.

---

## Estructura

```
1. Page head: eyebrow "Transacciones" + h1 "Ventas" + sub con counts + actions (Exportar + Nueva venta)
2. Filterbar: seg con 3 opciones (Todas / Activas / Eliminadas), cada una con count
3. Card con tabla
4. Drawer de detalle (540px)
5. Modal de confirmación para eliminar
```

## Tabla

| Col | Width | Notas |
|---|---|---|
| ID | 80 | `#1089` mono muted |
| Fecha | 160 | "12 may · 15:42" muted |
| Observaciones | flex | texto plano; si vacío, "Sin observaciones" en italic muted |
| Items | 70 right | count |
| Total | 140 right | `$X.XXX` bold tabular |
| Usuario | 140 | avatar 22 + nombre |
| Estado | 130 | `EstadoChip` |

**EstadoChip:**
```
- height 22px, padding 0 9px, radius 999, font 11.5 / 500
- ACTIVA: bg success-soft + color success, dot 6×6 fill currentColor
- ELIMINADA: bg surface-2 + color muted-strong + text-decoration line-through, dot opcional
```

**Click en row** → abre drawer de detalle.

## Drawer de detalle

**Header:**
- Title `Venta #1089`
- Subtitle: fecha completa + usuario

**Body:**

1. **Status row:** chip de estado + texto contextual
   - Si ELIMINADA: "Stock devuelto al inventario" (en muted 11.5)

2. **Observaciones** (si hay):
   - Label "Observaciones" uppercase muted
   - Box con bg surface, radius 8px, padding 12px, texto 13px

3. **Items** (label "Items (N)"):
   - Lista en un container con border + radius 10px overflow hidden
   - Cada line: flex space-between, padding 12px 14px, border-bottom 1px (último sin)
   - Main: nombre 13/500 + meta 11.5 muted ("CODIGO · N × $X" en flex gap 5px)
   - Sub: `$X.XXX` bold tabular

4. **Totales:**
   - Container bg surface, radius 10px, padding 12px 14px
   - Row "Subtotal" vs `$X.XXX` mono
   - Border-top dashed
   - Row "Total" vs `$X.XXX` strong 17px 600

**Footer del drawer:**
- Si ACTIVA: "Cerrar" (ghost) + "Eliminar venta" (btn-danger rojo, ícono Trash)
- Si ELIMINADA: solo "Cerrar" (con `marginLeft: auto`)

**Eliminar venta:**
- Abre ConfirmModal con texto:
  - Title: "Eliminar venta #N"
  - Description: "La venta se marcará como eliminada y el stock volverá al inventario. Queda registro en el historial."
  - Confirm: "Eliminar" (danger)
- Al confirmar: llamar al endpoint de delete, invalidar queries, mostrar toast info "Venta #N eliminada · Stock restaurado en N productos"

---

## API endpoints

| Acción | Endpoint |
|---|---|
| Listar | `GET /api/ventas` (acepta filtros) |
| Detalle | `GET /api/ventas/{id}` |
| Crear | `POST /api/ventas` (lo cubrimos en Fase 6 — POS) |
| Eliminar | `PUT /api/ventas/{id}/estado` con body `{ estado: "ANULADA" }` (mapeado a ELIMINADA en UI). Backend devuelve stock + genera movimientos ENTRADA. |

Confirmar con el backend: el endpoint `PUT /api/ventas/{id}/estado` puede aceptar `ANULADA` aún si la venta estaba COMPLETADA, y debe devolver el stock (no como dice el README original que dice "no modificar stock"). **Posible cambio de contrato del backend.**

Si el backend no soporta esa lógica todavía, alternativas:
- Endpoint nuevo `DELETE /api/ventas/{id}` que haga todo
- O hacer client-side: PUT estado + por cada detalle, POST movimiento ENTRADA. **Esto es frágil** — mejor centralizar en backend.

Documentá la decisión en el PR.

---

## Verificación

- [ ] Lista renderiza ordenada por fecha desc
- [ ] Filtros Todas/Activas/Eliminadas funcionan
- [ ] Filas ELIMINADA se ven tachadas
- [ ] Drawer de detalle muestra items con `precioUnitario` (precio congelado)
- [ ] Eliminar venta dispara confirmación, después del confirm:
  - La venta pasa a ELIMINADA visualmente
  - El stock del Dashboard sube
  - Aparece un toast confirmando
- [ ] Drawer de venta ELIMINADA: sólo botón Cerrar, sin Eliminar
