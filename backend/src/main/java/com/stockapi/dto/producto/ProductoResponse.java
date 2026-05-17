package com.stockapi.dto.producto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ProductoResponse {

    private Long id;
    private String nombre;
    private String codigo;
    private String categoria;
    private String descripcion;
    private BigDecimal precioCosto;
    private BigDecimal precioVenta;
    private Integer stockActual;
    private Integer stockMinimo;
    private Boolean activo;
    private LocalDateTime creadoEn;
    private LocalDateTime actualizadoEn;
    private BigDecimal valorInventario;
}
