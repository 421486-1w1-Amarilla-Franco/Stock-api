package com.stockapi.dto.venta;

import com.stockapi.model.Transaccion;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class VentaRequest {

    @Size(max = 255)
    private String observaciones;

    @NotEmpty
    @Valid
    private List<DetalleVentaRequest> detalles;

    /** Por defecto EFECTIVO. */
    private Transaccion.MedioPago medioPago;

    @PositiveOrZero
    private BigDecimal manoObra;

    private Long clienteId;

    private Long vehiculoId;

    @PositiveOrZero
    private Integer kmVehiculo;
}
