package com.stockapi.controller;

import com.stockapi.dto.PageResponse;
import com.stockapi.dto.movimiento.MovimientoRequest;
import com.stockapi.dto.movimiento.MovimientoResponse;
import com.stockapi.model.Movimiento;
import com.stockapi.service.MovimientoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/movimientos")
@RequiredArgsConstructor
@Tag(name = "Movimientos de Stock")
@SecurityRequirement(name = "bearerAuth")
public class MovimientoController {

    private final MovimientoService movimientoService;

    @GetMapping
    @Operation(summary = "Listar movimientos paginados (más recientes primero) con filtros opcionales")
    public PageResponse<MovimientoResponse> buscar(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Movimiento.TipoMovimiento tipo,
            @RequestParam(required = false) Long productoId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return movimientoService.buscar(q, tipo, productoId, desde, hasta,
                PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 200)));
    }

    @GetMapping("/conteo")
    @Operation(summary = "Cantidad de movimientos por tipo")
    public Map<String, Long> conteo() {
        return movimientoService.conteoPorTipo();
    }

    @GetMapping("/producto/{productoId}")
    @Operation(summary = "Historial de movimientos por producto")
    public ResponseEntity<List<MovimientoResponse>> listarPorProducto(@PathVariable Long productoId) {
        return ResponseEntity.ok(movimientoService.listarPorProducto(productoId));
    }

    @PostMapping
    @Operation(summary = "Registrar movimiento de stock (ENTRADA / SALIDA / AJUSTE)")
    public ResponseEntity<MovimientoResponse> registrar(@Valid @RequestBody MovimientoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(movimientoService.registrar(request));
    }
}
