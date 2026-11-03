package com.stockapi.dto.cliente;

public record VehiculoResponse(Long id, Long clienteId, String clienteNombre, String patente,
                               String marca, String modelo, Integer anio, Integer km) {
}
