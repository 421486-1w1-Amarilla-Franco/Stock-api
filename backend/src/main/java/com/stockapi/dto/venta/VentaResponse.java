package com.stockapi.dto.venta;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class VentaResponse {

    private Long id;
    private Long usuarioId;
    private String usuarioNombre;
    private BigDecimal total;
    private String estado;
    private String observaciones;
    private LocalDateTime fecha;
    private List<DetalleVentaResponse> detalles;

    @Data
    public static class DetalleVentaResponse {
        private Long id;
        private Long productoId;
        private String productoNombre;
        private String productoCodigo;
        private Integer cantidad;
        private BigDecimal precioUnitario;
        private BigDecimal subtotal;
    }
}
