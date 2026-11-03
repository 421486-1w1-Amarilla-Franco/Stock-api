package com.stockapi.controller;

import com.stockapi.dto.PageResponse;
import com.stockapi.dto.venta.VentaRequest;
import com.stockapi.dto.venta.VentaResponse;
import com.stockapi.model.Transaccion;
import com.stockapi.service.VentaService;
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
import java.util.Map;

@RestController
@RequestMapping("/api/ventas")
@RequiredArgsConstructor
@Tag(name = "Ventas")
@SecurityRequirement(name = "bearerAuth")
public class VentaController {

    private final VentaService ventaService;

    @PostMapping
    @Operation(summary = "Registrar venta (COMPLETADA, descuenta stock)")
    public ResponseEntity<VentaResponse> crear(@Valid @RequestBody VentaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ventaService.crear(request));
    }

    @PutMapping("/{id}/estado")
    @Operation(summary = "Actualizar estado de venta (COMPLETADA descuenta stock; ANULADA solo ADMIN)")
    public ResponseEntity<VentaResponse> actualizarEstado(@PathVariable Long id,
                                                           @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ventaService.actualizarEstado(id, body.get("estado")));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener venta con detalles")
    public ResponseEntity<VentaResponse> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(ventaService.obtenerPorId(id));
    }

    @GetMapping
    @Operation(summary = "Listar ventas paginadas (más recientes primero). q: número, observaciones, cliente o patente")
    public PageResponse<VentaResponse> buscar(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Transaccion.Estado estado,
            @RequestParam(required = false) Transaccion.MedioPago medioPago,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ventaService.buscar(q, estado, medioPago, desde, hasta,
                PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 200)));
    }
}
