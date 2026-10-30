package com.stockapi.dto.caja;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CierreRequest(@NotNull LocalDate fecha,
                            @NotNull @PositiveOrZero BigDecimal efectivoContado,
                            @Size(max = 255) String observaciones) {
}
