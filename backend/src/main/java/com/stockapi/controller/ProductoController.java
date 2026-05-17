package com.stockapi.controller;

import com.stockapi.dto.producto.ProductoRequest;
import com.stockapi.dto.producto.ProductoResponse;
import com.stockapi.model.Producto;
import com.stockapi.service.ProductoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/productos")
@RequiredArgsConstructor
@Tag(name = "Productos")
@SecurityRequirement(name = "bearerAuth")
public class ProductoController {

    private final ProductoService productoService;

    @GetMapping
    @Operation(summary = "Listar productos (activos por defecto, incluirInactivos=true para todos)")
    public ResponseEntity<List<ProductoResponse>> listarTodos(
            @RequestParam(defaultValue = "false") boolean incluirInactivos) {
        return ResponseEntity.ok(productoService.listarTodos(incluirInactivos));
    }

    @PostMapping("/{id}/restaurar")
    @Operation(summary = "Reactivar producto dado de baja")
    public ResponseEntity<ProductoResponse> restaurar(@PathVariable Long id) {
        return ResponseEntity.ok(productoService.restaurar(id));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener producto por id")
    public ResponseEntity<ProductoResponse> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(productoService.obtenerPorId(id));
    }

    @GetMapping("/categoria/{categoria}")
    @Operation(summary = "Filtrar productos por categoría (REPUESTO o LUBRICANTE)")
    public ResponseEntity<List<ProductoResponse>> listarPorCategoria(@PathVariable Producto.Categoria categoria) {
        return ResponseEntity.ok(productoService.listarPorCategoria(categoria));
    }

    @GetMapping("/bajo-stock")
    @Operation(summary = "Productos con stock igual o por debajo del mínimo")
    public ResponseEntity<List<ProductoResponse>> listarBajoStock() {
        return ResponseEntity.ok(productoService.listarBajoStock());
    }

    @PostMapping
    @Operation(summary = "Crear producto")
    public ResponseEntity<ProductoResponse> crear(@Valid @RequestBody ProductoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productoService.crear(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar producto")
    public ResponseEntity<ProductoResponse> actualizar(@PathVariable Long id,
                                                        @Valid @RequestBody ProductoRequest request) {
        return ResponseEntity.ok(productoService.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Dar de baja lógica (solo ADMIN)")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        productoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
