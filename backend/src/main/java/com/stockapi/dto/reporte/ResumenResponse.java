package com.stockapi.dto.reporte;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Todo lo que necesita el dashboard en un solo pedido.
 * Los campos *Anterior son el período inmediatamente previo de igual largo, para calcular variaciones reales.
 */
public record ResumenResponse(
        LocalDate desde,
        LocalDate hasta,
        BigDecimal ventas,
        BigDecimal ventasAnterior,
        long transacciones,
        long transaccionesAnterior,
        BigDecimal margen,
        BigDecimal margenAnterior,
        long ventasHoy,
        BigDecimal montoHoy,
        long productosBajoStock,
        BigDecimal valorInventarioCosto,
        BigDecimal valorInventarioVenta,
        List<BigDecimal> ventasDiarias,
        List<ProductoMasVendidoResponse> productosMasVendidos) {
}
