// =============================================================
// Global store — único source of truth para productos, ventas,
// movimientos y toasts. Mutaciones siempre via acciones del store.
// =============================================================

const StockContext = React.createContext(null);

const todayStr = () => {
  // Simulamos "ahora" como 2026-05-12 16:00 (consistente con datos dummy)
  return new Date(2026, 4, 12, 16, 0).toISOString();
};

const initialState = (() => {
  // Enriquecemos las transacciones con líneas de detalle reales,
  // así Ventas y POS pueden mostrar el desglose.
  const productosSeed = window.STOCK_DATA.productos.map(p => ({ ...p, activo: true }));
  const movimientosSeed = window.STOCK_DATA.movimientos.map(m => ({ ...m }));
  const transaccionesSeed = [
    {
      id: 1089, fecha: "2026-05-12T15:42:00", estado: "ACTIVA", usuario: "M. Álvarez",
      observaciones: "Cliente: Honda Civic 2018",
      detalles: [
        { productoId: 1,  cantidad: 1, precioUnitario: 8450,  subtotal: 8450  },
        { productoId: 4,  cantidad: 1, precioUnitario: 28750, subtotal: 28750 },
        { productoId: 12, cantidad: 1, precioUnitario: 6800,  subtotal: 6800  },
        { productoId: 8,  cantidad: 1, precioUnitario: 56800, subtotal: 56800 },
      ],
    },
    {
      id: 1088, fecha: "2026-05-12T14:18:00", estado: "ACTIVA", usuario: "J. Romero",
      observaciones: "Mostrador",
      detalles: [
        { productoId: 10, cantidad: 2, precioUnitario: 11900, subtotal: 23800 },
      ],
    },
    {
      id: 1087, fecha: "2026-05-12T10:33:00", estado: "ACTIVA", usuario: "J. Romero",
      observaciones: "VW Gol Trend — service básico",
      detalles: [
        { productoId: 2, cantidad: 4, precioUnitario: 4200, subtotal: 16800 },
        { productoId: 1, cantidad: 1, precioUnitario: 8450, subtotal: 8450  },
      ],
    },
    {
      id: 1086, fecha: "2026-05-11T17:22:00", estado: "ACTIVA", usuario: "L. Bravo",
      observaciones: "Cliente: Toyota Corolla 2020",
      detalles: [
        { productoId: 3, cantidad: 1, precioUnitario: 32900, subtotal: 32900 },
      ],
    },
    {
      id: 1085, fecha: "2026-05-11T12:08:00", estado: "ACTIVA", usuario: "J. Romero",
      observaciones: "Service VW Gol Trend",
      detalles: [
        { productoId: 5, cantidad: 1, precioUnitario: 24600, subtotal: 24600 },
        { productoId: 12, cantidad: 1, precioUnitario: 6800,  subtotal: 6800 },
      ],
    },
    {
      id: 1084, fecha: "2026-05-11T10:14:00", estado: "ACTIVA", usuario: "M. Álvarez",
      observaciones: "Reserva Ford Ranger — retira el lunes",
      detalles: [
        { productoId: 7, cantidad: 2, precioUnitario: 84500, subtotal: 169000 },
      ],
    },
    {
      id: 1083, fecha: "2026-05-10T16:40:00", estado: "ELIMINADA", usuario: "L. Bravo",
      observaciones: "Cliente desistió",
      detalles: [
        { productoId: 9, cantidad: 1, precioUnitario: 132400, subtotal: 132400 },
      ],
    },
  ];

  // recompute totales para que sean consistentes
  for (const t of transaccionesSeed) {
    t.total = t.detalles.reduce((s, d) => s + d.subtotal, 0);
  }

  return {
    productos: productosSeed,
    movimientos: movimientosSeed,
    transacciones: transaccionesSeed,
    ventasDiarias: [...window.STOCK_DATA.ventasDiarias],
    user: { id: 1, nombre: "M. Álvarez", iniciales: "MA", rol: "ADMIN" },
    nextProductoId: 100,
    nextVentaId: 1090,
    nextMovimientoId: 313,
    toasts: [],
  };
})();

function stockReducer(state, action) {
  switch (action.type) {
    case "PRODUCTO_CREATE": {
      const id = state.nextProductoId;
      const producto = {
        id,
        activo: true,
        creadoEn: todayStr(),
        ...action.payload,
      };
      return {
        ...state,
        productos: [producto, ...state.productos],
        nextProductoId: id + 1,
      };
    }

    case "PRODUCTO_UPDATE": {
      return {
        ...state,
        productos: state.productos.map(p =>
          p.id === action.id ? { ...p, ...action.patch, actualizadoEn: todayStr() } : p
        ),
      };
    }

    case "PRODUCTO_DELETE": {
      // baja lógica
      return {
        ...state,
        productos: state.productos.map(p =>
          p.id === action.id ? { ...p, activo: false } : p
        ),
      };
    }

    case "PRODUCTO_RESTORE": {
      return {
        ...state,
        productos: state.productos.map(p =>
          p.id === action.id ? { ...p, activo: true } : p
        ),
      };
    }

    case "VENTA_CREATE": {
      // snapshot del precio + valida stock + descuenta inmediato + genera SALIDA
      const detalles = action.detalles.map(d => {
        const producto = state.productos.find(p => p.id === d.productoId);
        const precioUnitario = producto?.precioVenta ?? 0;
        return {
          productoId: d.productoId,
          cantidad: d.cantidad,
          precioUnitario,
          subtotal: precioUnitario * d.cantidad,
        };
      });

      // validar stock suficiente para todos los items
      for (const d of detalles) {
        const p = state.productos.find(p => p.id === d.productoId);
        if (!p || p.stockActual < d.cantidad) {
          return {
            ...state,
            toasts: [
              ...state.toasts,
              {
                id: Math.random().toString(36).slice(2),
                kind: "error",
                title: "Stock insuficiente",
                description: `${p?.nombre ?? "Producto"} — disponible ${p?.stockActual ?? 0}, requerido ${d.cantidad}`,
              },
            ],
          };
        }
      }

      const id = state.nextVentaId;
      const total = detalles.reduce((s, d) => s + d.subtotal, 0);
      const venta = {
        id,
        fecha: todayStr(),
        estado: "ACTIVA",
        usuario: state.user.nombre,
        observaciones: action.observaciones || "",
        detalles,
        total,
      };

      // descontar stock + generar movimientos SALIDA
      let nextProductos = state.productos;
      const newMovs = [];
      let movId = state.nextMovimientoId;
      for (const d of detalles) {
        const p = nextProductos.find(p => p.id === d.productoId);
        const stockAnterior = p.stockActual;
        const stockPosterior = stockAnterior - d.cantidad;
        nextProductos = nextProductos.map(x =>
          x.id === p.id ? { ...x, stockActual: stockPosterior, actualizadoEn: todayStr() } : x
        );
        newMovs.push({
          id: movId++,
          fecha: todayStr(),
          tipo: "SALIDA",
          producto: p.id,
          cantidad: d.cantidad,
          usuario: state.user.nombre,
          nota: `Venta #${id}`,
          stockAnterior,
          stockPosterior,
        });
      }

      return {
        ...state,
        productos: nextProductos,
        transacciones: [venta, ...state.transacciones],
        movimientos: [...newMovs.reverse(), ...state.movimientos],
        nextVentaId: id + 1,
        nextMovimientoId: movId,
        toasts: [
          ...state.toasts,
          {
            id: Math.random().toString(36).slice(2),
            kind: "success",
            title: `Venta #${id} registrada`,
            description: `${detalles.length} producto${detalles.length === 1 ? "" : "s"} · ${"$" + total.toLocaleString("es-AR")}`,
          },
        ],
      };
    }

    case "VENTA_ELIMINAR": {
      const venta = state.transacciones.find(t => t.id === action.id);
      if (!venta || venta.estado === "ELIMINADA") return state;

      // restaurar stock + generar movimientos ENTRADA
      let nextProductos = state.productos;
      const newMovs = [];
      let movId = state.nextMovimientoId;
      for (const d of venta.detalles) {
        const p = nextProductos.find(p => p.id === d.productoId);
        if (!p) continue;
        const stockAnterior = p.stockActual;
        const stockPosterior = stockAnterior + d.cantidad;
        nextProductos = nextProductos.map(x =>
          x.id === p.id ? { ...x, stockActual: stockPosterior, actualizadoEn: todayStr() } : x
        );
        newMovs.push({
          id: movId++,
          fecha: todayStr(),
          tipo: "ENTRADA",
          producto: p.id,
          cantidad: d.cantidad,
          usuario: state.user.nombre,
          nota: `Anulación venta #${venta.id}`,
          stockAnterior,
          stockPosterior,
        });
      }

      return {
        ...state,
        productos: nextProductos,
        movimientos: [...newMovs.reverse(), ...state.movimientos],
        transacciones: state.transacciones.map(t =>
          t.id === venta.id ? { ...t, estado: "ELIMINADA" } : t
        ),
        nextMovimientoId: movId,
        toasts: [
          ...state.toasts,
          {
            id: Math.random().toString(36).slice(2),
            kind: "info",
            title: `Venta #${venta.id} eliminada`,
            description: venta.detalles.length === 1
              ? "Stock restaurado"
              : `Stock restaurado en ${venta.detalles.length} productos`,
          },
        ],
      };
    }

    case "MOVIMIENTO_CREATE": {
      const { productoId, tipo, cantidad, nota } = action.payload;
      const producto = state.productos.find(p => p.id === productoId);
      if (!producto) return state;
      const delta = tipo === "ENTRADA" ? cantidad : tipo === "SALIDA" ? -cantidad : cantidad;
      const stockAnterior = producto.stockActual;
      const stockPosterior = stockAnterior + delta;
      if (stockPosterior < 0) {
        return {
          ...state,
          toasts: [
            ...state.toasts,
            {
              id: Math.random().toString(36).slice(2),
              kind: "error",
              title: "Stock insuficiente",
              description: `${producto.nombre} no puede quedar en negativo`,
            },
          ],
        };
      }
      const mov = {
        id: state.nextMovimientoId,
        fecha: todayStr(),
        tipo,
        producto: productoId,
        cantidad: Math.abs(cantidad),
        usuario: state.user.nombre,
        nota: nota || "",
        stockAnterior,
        stockPosterior,
      };
      return {
        ...state,
        productos: state.productos.map(p =>
          p.id === productoId ? { ...p, stockActual: stockPosterior, actualizadoEn: todayStr() } : p
        ),
        movimientos: [mov, ...state.movimientos],
        nextMovimientoId: state.nextMovimientoId + 1,
        toasts: [
          ...state.toasts,
          {
            id: Math.random().toString(36).slice(2),
            kind: "success",
            title: `Movimiento registrado`,
            description: `${producto.nombre}: ${stockAnterior} → ${stockPosterior}`,
          },
        ],
      };
    }

    case "TOAST_PUSH": {
      return {
        ...state,
        toasts: [...state.toasts, { id: Math.random().toString(36).slice(2), ...action.toast }],
      };
    }

    case "TOAST_DISMISS": {
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.id) };
    }

    default:
      return state;
  }
}

const StockProvider = ({ children }) => {
  const [state, dispatch] = React.useReducer(stockReducer, initialState);

  const api = React.useMemo(() => ({
    ...state,
    productoById: (id) => state.productos.find(p => p.id === id),
    createProducto: (payload) => dispatch({ type: "PRODUCTO_CREATE", payload }),
    updateProducto: (id, patch) => dispatch({ type: "PRODUCTO_UPDATE", id, patch }),
    deleteProducto: (id) => dispatch({ type: "PRODUCTO_DELETE", id }),
    restoreProducto: (id) => dispatch({ type: "PRODUCTO_RESTORE", id }),
    createVenta: ({ detalles, observaciones }) => dispatch({ type: "VENTA_CREATE", detalles, observaciones }),
    eliminarVenta: (id) => dispatch({ type: "VENTA_ELIMINAR", id }),
    registerMovimiento: (payload) => dispatch({ type: "MOVIMIENTO_CREATE", payload }),
    toast: (toast) => dispatch({ type: "TOAST_PUSH", toast }),
    dismissToast: (id) => dispatch({ type: "TOAST_DISMISS", id }),
  }), [state]);

  return <StockContext.Provider value={api}>{children}</StockContext.Provider>;
};

const useStock = () => {
  const ctx = React.useContext(StockContext);
  if (!ctx) throw new Error("useStock outside provider");
  return ctx;
};

// Selectors derivados (KPIs en vivo)
const useKpis = () => {
  const { productos, transacciones, ventasDiarias } = useStock();
  return React.useMemo(() => {
    const valorInventario = productos
      .filter(p => p.activo)
      .reduce((s, p) => s + p.precioVenta * p.stockActual, 0);
    const activas = transacciones.filter(t => t.estado === "ACTIVA");
    const ventasHoyExtra = activas
      .filter(t => t.id >= 1090)
      .reduce((s, t) => s + t.total, 0);
    const ventasMesFinal = ventasDiarias.reduce((s, v) => s + v, 0) + ventasHoyExtra;
    const bajoStock = productos.filter(p => p.activo && p.stockActual <= p.stockMinimo).length;
    const ticketPromedio = activas.length > 0
      ? activas.reduce((s, t) => s + t.total, 0) / activas.length
      : 0;
    const ventasHoy = activas.filter(t => {
      const d = new Date(t.fecha);
      return d.getFullYear() === 2026 && d.getMonth() === 4 && d.getDate() === 12;
    }).length;
    return {
      valorInventario,
      valorInventarioDelta: 4.2,
      ventasMes: ventasMesFinal,
      ventasMesDelta: 18.4,
      bajoStock,
      bajoStockDelta: 2,
      ventasHoy,
      ventasHoyDelta: 0,
      ticketPromedio,
      ticketPromedioDelta: 6.8,
    };
  }, [productos, transacciones, ventasDiarias]);
};

Object.assign(window, { StockProvider, useStock, useKpis, StockContext });
