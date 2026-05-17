package com.stockapi.dto.producto;

import com.stockapi.model.Producto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductoRequest {

    @NotBlank
    private String nombre;

    private String codigo;

    @NotNull
    private Producto.Categoria categoria;

    private String descripcion;

    @PositiveOrZero
    private BigDecimal precioCosto = BigDecimal.ZERO;

    @PositiveOrZero
    private BigDecimal precioVenta = BigDecimal.ZERO;

    @PositiveOrZero
    private Integer stockActual = 0;

    @PositiveOrZero
    private Integer stockMinimo = 0;
}
