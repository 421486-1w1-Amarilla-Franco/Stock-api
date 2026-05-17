# Fase 5 · Movimientos

> **Prerequisitos:** Fases 1-4.
> **Objetivo:** Pantalla `/movimientos` con tabla completa + filtros por tipo, producto y búsqueda libre.

Mirá `design_handoff/reference/src/screens-movimientos.jsx`.

Esta fase es relativamente chica — la mayoría de los componentes ya existen (TipoChip de Fase 2, filterbar de Fase 3).

---

## Estructura

```
1. Page head: eyebrow "Trazabilidad" + h1 "Movimientos" + sub con counts + action "Registrar movimiento"
   (el botón "Registrar movimiento" lo conectamos en Fase 7; por ahora visual nada más o que tire un placeholder)
2. Filterbar: search + seg tipo (Todos/Entradas/Salidas/Ajustes) + active-filter chip (si hay producto filtrado)
3. Card con tabla completa
```

## Search behavior

El search box matchea contra:
- Nombre del producto
- Código del producto
- Texto de la nota
- Nombre del usuario

Case-insensitive, substring match.

## Tabla

Idéntica a la de "Recent Movements" del Dashboard pero **sin límite de 10 filas** y con una diferencia clave: la celda de Producto es **clickable** para filtrar por ese producto.

```
Columnas:
- #          70px      mono ID
- Producto   flex      nombre + código (clickable como link-cell)
- Tipo       110       TipoChip
- Cant.      90 right  con signo
- Stock      130 right stockAnterior → stockPosterior
- Usuario    160       avatar + nombre
- Nota       160       muted
- Fecha      130 right "12 may · 15:42" muted
```

**link-cell** (celda de producto clickable):

```css
.link-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: transparent;
  border: 0;
  text-align: left;
  padding: 0;
  cursor: pointer;
  color: inherit;
  font: inherit;
}
.link-cell:hover .td-product-name { color: var(--accent); }
```

Al hacer click: `setProductoFilter(m.producto)`.

## Active filter chip

Cuando hay un `productoFilter` seteado, mostrar al lado del seg control:

```
[Producto: <strong>Filtro Mann W712</strong> ✕]
```

- Background `--accent-soft`, border `--accent` al 30%, color `--accent`
- Padding 4px 6px 4px 10px, radius 6px
- Botón "✕" 18×18 al final, hover bg accent al 16%
- Click en ✕ → `setProductoFilter(null)`

## Endpoints

| Acción | Endpoint |
|---|---|
| Listar todos | `GET /api/movimientos` (paginar si hay muchos) |
| Por producto | `GET /api/movimientos/producto/{productoId}` |
| Crear | `POST /api/movimientos` con body `{ productoId, tipo, cantidad, nota }` (Fase 7) |

El listado puede ser cliente-side filtering inicialmente (en el prototipo es así). Si la tabla supera ~500 filas, hacer paginación + filtros server-side.

---

## Verificación

- [ ] Lista renderiza ordenada por fecha desc
- [ ] Filtros tipo funcionan y muestran count
- [ ] Search libre matchea producto, código, nota, usuario
- [ ] Click en producto de cualquier fila → filtra esa pantalla a ese producto + muestra chip removible
- [ ] Empty state cuando no hay resultados
- [ ] Cantidades con signo + color (verde entrada, rojo salida)
- [ ] La columna Stock muestra trazabilidad anterior → posterior
