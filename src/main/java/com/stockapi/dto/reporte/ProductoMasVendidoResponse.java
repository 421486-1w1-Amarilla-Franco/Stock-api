package com.stockapi.dto.reporte;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ProductoMasVendidoResponse {

    private String nombre;
    private Long cantidadVendida;
}
