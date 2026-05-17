package com.stockapi.controller;

import com.stockapi.dto.producto.ProductoResponse;
import com.stockapi.dto.reporte.ReporteVentasResponse;
import com.stockapi.service.ReporteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reportes")
@RequiredArgsConstructor
@Tag(name = "Reportes")
@SecurityRequirement(name = "bearerAuth")
public class ReporteController {

    private final ReporteService reporteService;

    @GetMapping("/ventas")
    @Operation(summary = "Reporte de ventas por período")
    public ResponseEntity<ReporteVentasResponse> reporteVentas(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ResponseEntity.ok(reporteService.reporteVentas(desde, hasta));
    }

    @GetMapping("/stock")
    @Operation(summary = "Stock actual con valor de inventario de todos los productos")
    public ResponseEntity<List<ProductoResponse>> reporteStock() {
        return ResponseEntity.ok(reporteService.reporteStock());
    }
}
