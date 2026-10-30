package com.stockapi.dto;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

/** Página estable para el frontend (evita serializar PageImpl, cuyo JSON no es contrato de Spring). */
public record PageResponse<T>(List<T> content, long totalElements, int totalPages, int page, int size) {

    public static <E, T> PageResponse<T> of(Page<E> page, Function<E, T> mapper) {
        return new PageResponse<>(page.getContent().stream().map(mapper).toList(),
                page.getTotalElements(), page.getTotalPages(), page.getNumber(), page.getSize());
    }
}
