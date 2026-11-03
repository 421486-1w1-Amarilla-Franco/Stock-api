package com.stockapi.dto.cliente;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ClienteRequest(
        @NotBlank @Size(max = 120) String nombre,
        @Size(max = 40) String telefono,
        @Email @Size(max = 150) String email,
        @Size(max = 20) String documento,
        @Size(max = 255) String notas) {
}
