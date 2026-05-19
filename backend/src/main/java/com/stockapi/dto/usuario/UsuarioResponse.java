package com.stockapi.dto.usuario;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UsuarioResponse {
    private Long id;
    private String nombre;
    private String email;
    private String rol;
    private Boolean activo;
    private LocalDateTime creadoEn;
}
