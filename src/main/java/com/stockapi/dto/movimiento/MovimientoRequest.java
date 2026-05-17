package com.stockapi.dto.movimiento;

import com.stockapi.model.Movimiento;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MovimientoRequest {

    @NotNull
    private Long productoId;

    @NotNull
    private Movimiento.TipoMovimiento tipo;

    @NotNull
    private Integer cantidad;

    private String nota;
}
