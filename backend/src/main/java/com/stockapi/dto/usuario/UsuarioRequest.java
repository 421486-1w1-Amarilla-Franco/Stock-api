package com.stockapi.dto.usuario;

import com.stockapi.model.Usuario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UsuarioRequest {

    @NotBlank
    private String nombre;

    @Email
    @NotBlank
    private String email;

    private String password;

    @NotNull
    private Usuario.Rol rol;
}
