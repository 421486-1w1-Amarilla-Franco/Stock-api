package com.stockapi.dto.compra;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record CompraRequest(
        @NotNull Long proveedorId,
        @Size(max = 40) String comprobante,
        @Size(max = 255) String observaciones,
        @NotEmpty @Valid List<Linea> detalles) {

    public record Linea(@NotNull Long productoId, @NotNull @Min(1) Integer cantidad,
                        @NotNull @PositiveOrZero BigDecimal costoUnitario) {
    }
}
