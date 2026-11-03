package com.stockapi.dto.compra;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProveedorRequest(
        @NotBlank @Size(max = 120) String nombre,
        @Size(max = 13) String cuit,
        @Size(max = 40) String telefono,
        @Email @Size(max = 150) String email) {
}
