package com.stockapi.controller;

import com.stockapi.dto.cliente.ClienteRequest;
import com.stockapi.dto.cliente.ClienteResponse;
import com.stockapi.dto.cliente.VehiculoRequest;
import com.stockapi.dto.cliente.VehiculoResponse;
import com.stockapi.dto.venta.VentaResponse;
import com.stockapi.service.ClienteService;
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

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Clientes y vehículos")
@SecurityRequirement(name = "bearerAuth")
public class ClienteController {

    private final ClienteService clienteService;
    private final VentaService ventaService;

    @GetMapping("/clientes")
    @Operation(summary = "Buscar clientes por nombre, teléfono, documento o patente")
    public List<ClienteResponse> buscar(@RequestParam(defaultValue = "") String q) {
        return clienteService.buscar(q);
    }

    @GetMapping("/clientes/{id}")
    public ClienteResponse obtener(@PathVariable Long id) {
        return clienteService.obtener(id);
    }

    @PostMapping("/clientes")
    public ResponseEntity<ClienteResponse> crear(@Valid @RequestBody ClienteRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(clienteService.crear(req));
    }

    @PutMapping("/clientes/{id}")
    public ClienteResponse actualizar(@PathVariable Long id, @Valid @RequestBody ClienteRequest req) {
        return clienteService.actualizar(id, req);
    }

    @DeleteMapping("/clientes/{id}")
    @Operation(summary = "Baja lógica de cliente")
    public ResponseEntity<Void> desactivar(@PathVariable Long id) {
        clienteService.desactivar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/clientes/{id}/ventas")
    @Operation(summary = "Historial de ventas y trabajos del cliente")
    public List<VentaResponse> ventasCliente(@PathVariable Long id) {
        return ventaService.listarPorCliente(id);
    }

    @PostMapping("/clientes/{id}/vehiculos")
    public ResponseEntity<VehiculoResponse> agregarVehiculo(@PathVariable Long id, @Valid @RequestBody VehiculoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(clienteService.agregarVehiculo(id, req));
    }

    @PutMapping("/vehiculos/{id}")
    public VehiculoResponse actualizarVehiculo(@PathVariable Long id, @Valid @RequestBody VehiculoRequest req) {
        return clienteService.actualizarVehiculo(id, req);
    }

    @GetMapping("/vehiculos/patente/{patente}")
    @Operation(summary = "Buscar vehículo por patente")
    public VehiculoResponse porPatente(@PathVariable String patente) {
        return clienteService.buscarPorPatente(patente);
    }

    @GetMapping("/vehiculos/{id}/ventas")
    @Operation(summary = "Historial de trabajos del vehículo")
    public List<VentaResponse> ventasVehiculo(@PathVariable Long id) {
        return ventaService.listarPorVehiculo(id);
    }
}
