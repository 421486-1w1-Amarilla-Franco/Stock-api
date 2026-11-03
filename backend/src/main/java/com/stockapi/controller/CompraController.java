package com.stockapi.controller;

import com.stockapi.dto.compra.*;
import com.stockapi.service.CompraService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Proveedores y compras")
@SecurityRequirement(name = "bearerAuth")
public class CompraController {

    private final CompraService compraService;

    @GetMapping("/proveedores")
    public List<ProveedorResponse> proveedores() {
        return compraService.listarProveedores();
    }

    @PostMapping("/proveedores")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProveedorResponse> crearProveedor(@Valid @RequestBody ProveedorRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(compraService.crearProveedor(req));
    }

    @PutMapping("/proveedores/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ProveedorResponse actualizarProveedor(@PathVariable Long id, @Valid @RequestBody ProveedorRequest req) {
        return compraService.actualizarProveedor(id, req);
    }

    @DeleteMapping("/proveedores/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> desactivarProveedor(@PathVariable Long id) {
        compraService.desactivarProveedor(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/compras")
    public List<CompraResponse> compras() {
        return compraService.listar();
    }

    @GetMapping("/compras/sugerencias")
    @Operation(summary = "Productos a reponer con cantidad sugerida")
    public List<SugerenciaCompraResponse> sugerencias() {
        return compraService.sugerencias();
    }

    @GetMapping("/compras/{id}")
    public CompraResponse compra(@PathVariable Long id) {
        return compraService.obtener(id);
    }

    @PostMapping("/compras")
    @Operation(summary = "Crear orden de compra (PENDIENTE, no mueve stock)")
    public ResponseEntity<CompraResponse> crear(@Valid @RequestBody CompraRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(compraService.crear(req));
    }

    @PostMapping("/compras/{id}/recibir")
    @Operation(summary = "Recibir mercadería: suma stock y actualiza costos")
    public CompraResponse recibir(@PathVariable Long id) {
        return compraService.recibir(id);
    }

    @PostMapping("/compras/{id}/anular")
    @PreAuthorize("hasRole('ADMIN')")
    public CompraResponse anular(@PathVariable Long id) {
        return compraService.anular(id);
    }
}
