package com.stockapi.exception;

/** El pedido choca con el estado actual de los datos (duplicado, estado inválido…). Responde 409. */
public class ConflictException extends RuntimeException {
    public ConflictException(String mensaje) {
        super(mensaje);
    }
}
