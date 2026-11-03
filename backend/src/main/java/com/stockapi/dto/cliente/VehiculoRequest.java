package com.stockapi.dto.cliente;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record VehiculoRequest(
        @NotBlank @Size(max = 12) String patente,
        @Size(max = 60) String marca,
        @Size(max = 60) String modelo,
        @Min(1900) @Max(2100) Integer anio,
        @PositiveOrZero Integer km) {
}
