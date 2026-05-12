package com.stockapi.controller;

import com.stockapi.dto.venta.VentaRequest;
import com.stockapi.dto.venta.VentaResponse;
import com.stockapi.service.VentaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ventas")
@RequiredArgsConstructor
@Tag(name = "Ventas")
@SecurityRequirement(name = "bearerAuth")
public class VentaController {

    private final VentaService ventaService;

    @PostMapping
    @Operation(summary = "Crear venta (estado inicial: PENDIENTE)")
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
    @Operation(summary = "Listar todas las ventas")
    public ResponseEntity<List<VentaResponse>> listarTodas() {
        return ResponseEntity.ok(ventaService.listarTodas());
    }
}
