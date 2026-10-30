package com.stockapi.dto.reporte;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class ReporteVentasResponse {

    private PeriodoInfo periodo;
    private BigDecimal totalVentas;
    private Long cantidadTransacciones;
    private List<ProductoMasVendidoResponse> productosMasVendidos;
    private List<BigDecimal> ventasDiarias;
    /** Costo histórico de la mercadería vendida. */
    private BigDecimal costoMercaderia;
    private BigDecimal manoObra;
    /** totalVentas − costoMercaderia. */
    private BigDecimal margen;

    @Data
    public static class PeriodoInfo {
        private String desde;
        private String hasta;
    }
}
