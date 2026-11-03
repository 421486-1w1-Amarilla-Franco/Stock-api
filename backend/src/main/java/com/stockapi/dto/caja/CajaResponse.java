package com.stockapi.dto.caja;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

/** Resumen de caja de un día: lo vendido por medio de pago y, si existe, su cierre. */
public record CajaResponse(LocalDate fecha, long cantidadVentas, BigDecimal total,
                           Map<String, BigDecimal> totalesPorMedio, CierreResponse cierre) {
}
