package com.stockapi.dto.compra;

import java.math.BigDecimal;

/** Producto bajo el mínimo con la cantidad sugerida para volver a 2× el mínimo. */
public record SugerenciaCompraResponse(Long productoId, String nombre, String codigo, Integer stockActual,
                                       Integer stockMinimo, Integer cantidadSugerida, BigDecimal costoUnitario) {
}
