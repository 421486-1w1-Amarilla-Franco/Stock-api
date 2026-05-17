package com.stockapi.dto.movimiento;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MovimientoResponse {

    private Long id;
    private Long productoId;
    private String productoNombre;
    private String productoCodigo;
    private Long usuarioId;
    private String usuarioNombre;
    private String tipo;
    private Integer cantidad;
    private String nota;
    private Integer stockAnterior;
    private Integer stockPosterior;
    private LocalDateTime fecha;
}
