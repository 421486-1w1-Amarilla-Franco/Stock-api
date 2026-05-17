// Dummy data — taller mecánico
window.STOCK_DATA = (() => {
  const productos = [
    { id: 1,  codigo: "FLT-W712",     nombre: "Filtro de aceite Mann W712/52",        categoria: "REPUESTO",   precioCosto: 5100,   precioVenta: 8450,    stockActual: 24, stockMinimo: 10, descripcion: "Filtro de aceite atornillable. Compatibilidad: Fiat, VW, Renault." },
    { id: 2,  codigo: "BUJ-BKR6E",    nombre: "Bujía NGK BKR6E iridium",                categoria: "REPUESTO",   precioCosto: 2400,   precioVenta: 4200,    stockActual: 3,  stockMinimo: 12, descripcion: "Bujía de iridium 14mm. Vendida por unidad." },
    { id: 3,  codigo: "PFR-FDB1636",  nombre: "Pastillas de freno Ferodo Premier",      categoria: "REPUESTO",   precioCosto: 19500,  precioVenta: 32900,   stockActual: 8,  stockMinimo: 6,  descripcion: "Juego delantero. Compatible con Honda Civic, Fit, City." },
    { id: 4,  codigo: "ACT-M1-5W30",  nombre: "Aceite Mobil 1 ESP 5W-30 · 4L",          categoria: "LUBRICANTE", precioCosto: 18900,  precioVenta: 28750,   stockActual: 2,  stockMinimo: 8,  descripcion: "Aceite sintético de bajo SAPS para motores diesel modernos." },
    { id: 5,  codigo: "CRR-T179",     nombre: "Correa distribución Gates T179",         categoria: "REPUESTO",   precioCosto: 14400,  precioVenta: 24600,   stockActual: 11, stockMinimo: 5,  descripcion: "Correa dentada 153 dientes. Cambio cada 60.000 km." },
    { id: 6,  codigo: "RFG-TT-5L",    nombre: "Refrigerante Total Coolelf 5L",          categoria: "LUBRICANTE", precioCosto: 8800,   precioVenta: 14200,   stockActual: 4,  stockMinimo: 10, descripcion: "Líquido refrigerante anticongelante listo para uso." },
    { id: 7,  codigo: "AMR-M-23456",  nombre: "Amortiguador Monroe G7 trasero",         categoria: "REPUESTO",   precioCosto: 51200,  precioVenta: 84500,   stockActual: 6,  stockMinimo: 4,  descripcion: "Amortiguador a gas. Vendido por unidad. Recomendado de a pares." },
    { id: 8,  codigo: "FLA-KN-33",    nombre: "Filtro de aire K&N 33-2304",             categoria: "REPUESTO",   precioCosto: 34800,  precioVenta: 56800,   stockActual: 9,  stockMinimo: 4,  descripcion: "Filtro de alto flujo lavable. Mayor performance, requiere mantenimiento." },
    { id: 9,  codigo: "BAT-M22GD",    nombre: "Batería Moura M22GD 65Ah",               categoria: "REPUESTO",   precioCosto: 88000,  precioVenta: 132400,  stockActual: 5,  stockMinimo: 3,  descripcion: "Batería libre mantenimiento. Garantía 18 meses." },
    { id: 10, codigo: "LAM-H4-OS",    nombre: "Lámpara H4 Osram Night Breaker 200",     categoria: "REPUESTO",   precioCosto: 6900,   precioVenta: 11900,   stockActual: 1,  stockMinimo: 8,  descripcion: "Lámpara halógena 200% más luz. Se vende por unidad." },
    { id: 11, codigo: "ACT-SH-15W40", nombre: "Aceite Shell Rimula R4 15W-40 · 20L",    categoria: "LUBRICANTE", precioCosto: 64000,  precioVenta: 94500,   stockActual: 7,  stockMinimo: 3,  descripcion: "Aceite mineral para motores diesel HD. Bidón 20L." },
    { id: 12, codigo: "LFR-DOT4",     nombre: "Líquido de frenos DOT 4 · 500ml",         categoria: "LUBRICANTE", precioCosto: 3800,   precioVenta: 6800,    stockActual: 18, stockMinimo: 8,  descripcion: "Líquido sintético DOT 4. Cambio cada 2 años." },
    { id: 13, codigo: "DSC-FR-MC",    nombre: "Disco de freno Brembo perforado",        categoria: "REPUESTO",   precioCosto: 48500,  precioVenta: 78900,   stockActual: 2,  stockMinimo: 4,  descripcion: "Disco perforado y ranurado. Vendido por unidad." },
    { id: 14, codigo: "ESC-EMB-LUK",  nombre: "Kit embrague LUK 624 3144 09",           categoria: "REPUESTO",   precioCosto: 102000, precioVenta: 165000,  stockActual: 3,  stockMinimo: 2,  descripcion: "Kit completo: plato, disco y rulé de empuje." },
  ];

  // Movimientos: cronológico (más reciente primero)
  const movimientos = [
    { id: 312, fecha: "2026-05-12T15:42", tipo: "SALIDA",  producto: 4,  cantidad: 1, usuario: "M. Álvarez", nota: "Venta #1089", stockAnterior: 3, stockPosterior: 2 },
    { id: 311, fecha: "2026-05-12T15:42", tipo: "SALIDA",  producto: 1,  cantidad: 1, usuario: "M. Álvarez", nota: "Venta #1089", stockAnterior: 25, stockPosterior: 24 },
    { id: 310, fecha: "2026-05-12T14:18", tipo: "SALIDA",  producto: 10, cantidad: 2, usuario: "J. Romero",  nota: "Venta #1088", stockAnterior: 3,  stockPosterior: 1 },
    { id: 309, fecha: "2026-05-12T11:05", tipo: "ENTRADA", producto: 7,  cantidad: 4, usuario: "M. Álvarez", nota: "OC 2026-041", stockAnterior: 2,  stockPosterior: 6 },
    { id: 308, fecha: "2026-05-12T10:33", tipo: "SALIDA",  producto: 2,  cantidad: 4, usuario: "J. Romero",  nota: "Venta #1087", stockAnterior: 7,  stockPosterior: 3 },
    { id: 307, fecha: "2026-05-12T09:51", tipo: "AJUSTE",  producto: 13, cantidad: -1, usuario: "M. Álvarez", nota: "Rotura recibida", stockAnterior: 3, stockPosterior: 2 },
    { id: 306, fecha: "2026-05-11T17:22", tipo: "SALIDA",  producto: 3,  cantidad: 1, usuario: "L. Bravo",   nota: "Venta #1086", stockAnterior: 9,  stockPosterior: 8 },
    { id: 305, fecha: "2026-05-11T16:40", tipo: "ENTRADA", producto: 12, cantidad: 12, usuario: "M. Álvarez", nota: "OC 2026-040", stockAnterior: 6,  stockPosterior: 18 },
    { id: 304, fecha: "2026-05-11T12:08", tipo: "SALIDA",  producto: 5,  cantidad: 1, usuario: "J. Romero",  nota: "Venta #1085", stockAnterior: 12, stockPosterior: 11 },
    { id: 303, fecha: "2026-05-11T10:14", tipo: "SALIDA",  producto: 6,  cantidad: 2, usuario: "L. Bravo",   nota: "Venta #1084", stockAnterior: 6,  stockPosterior: 4 },
  ];

  // 30 días de ventas (más reciente al final)
  // Generado pero realista, con bajón fin de semana
  const ventasDiarias = [
    32400, 41200, 38900, 44100, 51200, 24800, 19400,
    47600, 52100, 48800, 55400, 49200, 28600, 22100,
    51800, 58400, 53200, 61200, 57800, 31400, 26800,
    62100, 67400, 58900, 71200, 64800, 35400, 28900,
    73200, 81400,
  ];

  // KPIs derivados
  const valorInventario = productos.reduce((s, p) => s + p.precioVenta * p.stockActual, 0);
  const ventasMes = ventasDiarias.reduce((s, v) => s + v, 0);
  const bajoStock = productos.filter(p => p.stockActual <= p.stockMinimo).length;
  const transaccionesPendientes = 3;

  const transaccionesRecientes = [
    { id: 1089, fecha: "2026-05-12T15:42", items: 4, total: 41600, estado: "COMPLETADA", usuario: "M. Álvarez" },
    { id: 1088, fecha: "2026-05-12T14:18", items: 2, total: 23800, estado: "COMPLETADA", usuario: "J. Romero" },
    { id: 1087, fecha: "2026-05-12T10:33", items: 5, total: 28700, estado: "COMPLETADA", usuario: "J. Romero" },
    { id: 1086, fecha: "2026-05-11T17:22", items: 1, total: 32900, estado: "COMPLETADA", usuario: "L. Bravo" },
    { id: 1085, fecha: "2026-05-11T12:08", items: 3, total: 56400, estado: "PENDIENTE",  usuario: "J. Romero" },
  ];

  return {
    productos,
    movimientos,
    ventasDiarias,
    transaccionesRecientes,
    kpis: {
      valorInventario,
      valorInventarioDelta: 4.2,
      ventasMes,
      ventasMesDelta: 18.4,
      bajoStock,
      bajoStockDelta: 2,
      transaccionesPendientes,
      transaccionesPendientesDelta: 0,
    },
    productoById: (id) => productos.find(p => p.id === id),
  };
})();
