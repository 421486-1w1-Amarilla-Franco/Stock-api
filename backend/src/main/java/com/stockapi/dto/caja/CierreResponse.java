package com.stockapi.dto.caja;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record CierreResponse(Long id, LocalDate fecha, String usuarioNombre, Integer cantidadVentas,
                             BigDecimal totalEfectivo, BigDecimal totalDebito, BigDecimal totalCredito,
                             BigDecimal totalTransferencia, BigDecimal efectivoContado, BigDecimal diferencia,
                             String observaciones, LocalDateTime creadoEn) {
}
