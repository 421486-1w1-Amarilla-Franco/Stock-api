package com.stockapi.dto.venta;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class VentaRequest {

    private String observaciones;

    @NotEmpty
    @Valid
    private List<DetalleVentaRequest> detalles;
}
