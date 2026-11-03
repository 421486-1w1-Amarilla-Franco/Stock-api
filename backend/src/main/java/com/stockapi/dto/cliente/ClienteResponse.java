package com.stockapi.dto.cliente;

import java.time.LocalDateTime;
import java.util.List;

public record ClienteResponse(Long id, String nombre, String telefono, String email, String documento,
                              String notas, Boolean activo, LocalDateTime creadoEn,
                              List<VehiculoResponse> vehiculos) {
}
