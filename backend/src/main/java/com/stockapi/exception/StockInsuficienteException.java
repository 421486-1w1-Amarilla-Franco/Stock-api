package com.stockapi.exception;

public class StockInsuficienteException extends RuntimeException {
    public StockInsuficienteException(String producto, int disponible, int solicitado) {
        super(String.format("Stock insuficiente para '%s'. Disponible: %d, Solicitado: %d",
                producto, disponible, solicitado));
    }
}
