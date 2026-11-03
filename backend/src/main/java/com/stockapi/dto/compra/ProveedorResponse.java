package com.stockapi.dto.compra;

public record ProveedorResponse(Long id, String nombre, String cuit, String telefono, String email, Boolean activo) {
}
