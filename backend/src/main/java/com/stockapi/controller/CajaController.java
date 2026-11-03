package com.stockapi.controller;

import com.stockapi.dto.caja.CajaResponse;
import com.stockapi.dto.caja.CierreRequest;
import com.stockapi.dto.caja.CierreResponse;
import com.stockapi.service.CajaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/caja")
@RequiredArgsConstructor
@Tag(name = "Caja")
@SecurityRequirement(name = "bearerAuth")
public class CajaController {

    private final CajaService cajaService;

    @GetMapping
    @Operation(summary = "Resumen del día por medio de pago (por defecto hoy)")
    public CajaResponse resumen(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return cajaService.resumen(fecha != null ? fecha : LocalDate.now());
    }

    @PostMapping("/cierres")
    @Operation(summary = "Cerrar la caja de un día")
    public ResponseEntity<CierreResponse> cerrar(@Valid @RequestBody CierreRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cajaService.cerrar(req));
    }

    @GetMapping("/cierres")
    @Operation(summary = "Últimos 60 cierres")
    public List<CierreResponse> historial() {
        return cajaService.historial();
    }
}
