package com.stockapi.dto.reporte;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class ProductoMasVendidoResponse {

    private String nombre;
    private Long cantidadVendida;
    private BigDecimal ingresos;
}
