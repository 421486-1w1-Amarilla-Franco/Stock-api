package com.stockapi.dto.compra;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record CompraResponse(Long id, Long proveedorId, String proveedorNombre, String usuarioNombre,
                             String estado, String comprobante, String observaciones, BigDecimal total,
                             LocalDateTime fecha, LocalDateTime recibidaEn, List<Linea> detalles) {

    public record Linea(Long productoId, String productoNombre, String productoCodigo,
                        Integer cantidad, BigDecimal costoUnitario, BigDecimal subtotal) {
    }
}
