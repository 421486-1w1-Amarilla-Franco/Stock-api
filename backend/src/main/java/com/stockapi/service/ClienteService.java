package com.stockapi.service;

import com.stockapi.dto.cliente.ClienteRequest;
import com.stockapi.dto.cliente.ClienteResponse;
import com.stockapi.dto.cliente.VehiculoRequest;
import com.stockapi.dto.cliente.VehiculoResponse;
import com.stockapi.exception.ConflictException;
import com.stockapi.exception.ResourceNotFoundException;
import com.stockapi.model.Cliente;
import com.stockapi.model.Vehiculo;
import com.stockapi.repository.ClienteRepository;
import com.stockapi.repository.VehiculoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final VehiculoRepository vehiculoRepository;

    @Transactional(readOnly = true)
    public List<ClienteResponse> buscar(String q) {
        return clienteRepository.buscar(q == null ? "" : q.trim().toLowerCase()).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ClienteResponse obtener(Long id) {
        return toResponse(findCliente(id));
    }

    @Transactional
    public ClienteResponse crear(ClienteRequest req) {
        Cliente c = new Cliente();
        map(c, req);
        return toResponse(clienteRepository.save(c));
    }

    @Transactional
    public ClienteResponse actualizar(Long id, ClienteRequest req) {
        Cliente c = findCliente(id);
        map(c, req);
        return toResponse(c);
    }

    @Transactional
    public void desactivar(Long id) {
        findCliente(id).setActivo(false);
    }

    @Transactional
    public VehiculoResponse agregarVehiculo(Long clienteId, VehiculoRequest req) {
        Cliente c = findCliente(clienteId);
        String patente = normalizarPatente(req.patente());
        if (vehiculoRepository.existsByPatente(patente)) {
            throw new ConflictException("La patente " + patente + " ya está registrada.");
        }
        Vehiculo v = new Vehiculo();
        v.setCliente(c);
        mapVehiculo(v, req, patente);
        return toVehiculo(vehiculoRepository.save(v));
    }

    @Transactional
    public VehiculoResponse actualizarVehiculo(Long vehiculoId, VehiculoRequest req) {
        Vehiculo v = vehiculoRepository.findById(vehiculoId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehículo no encontrado con id: " + vehiculoId));
        String patente = normalizarPatente(req.patente());
        if (vehiculoRepository.existsByPatenteAndIdNot(patente, vehiculoId)) {
            throw new ConflictException("La patente " + patente + " ya está registrada.");
        }
        mapVehiculo(v, req, patente);
        return toVehiculo(v);
    }

    @Transactional(readOnly = true)
    public VehiculoResponse buscarPorPatente(String patente) {
        return vehiculoRepository.findByPatente(normalizarPatente(patente)).map(this::toVehiculo)
                .orElseThrow(() -> new ResourceNotFoundException("No hay vehículo con patente " + patente));
    }

    /** "ab 123 cd" / "AB-123-CD" → "AB123CD". */
    static String normalizarPatente(String patente) {
        String p = patente == null ? "" : patente.replaceAll("[\\s-]", "").toUpperCase();
        if (p.isEmpty() || p.length() > 10) throw new IllegalArgumentException("Patente inválida: " + patente);
        return p;
    }

    private Cliente findCliente(Long id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con id: " + id));
    }

    private static void map(Cliente c, ClienteRequest r) {
        c.setNombre(r.nombre().trim());
        c.setTelefono(blank(r.telefono()));
        c.setEmail(blank(r.email()));
        c.setDocumento(blank(r.documento()));
        c.setNotas(blank(r.notas()));
    }

    private static void mapVehiculo(Vehiculo v, VehiculoRequest r, String patente) {
        v.setPatente(patente);
        v.setMarca(blank(r.marca()));
        v.setModelo(blank(r.modelo()));
        v.setAnio(r.anio());
        v.setKm(r.km());
    }

    private static String blank(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    ClienteResponse toResponse(Cliente c) {
        return new ClienteResponse(c.getId(), c.getNombre(), c.getTelefono(), c.getEmail(), c.getDocumento(),
                c.getNotas(), c.getActivo(), c.getCreadoEn(), c.getVehiculos().stream().map(this::toVehiculo).toList());
    }

    VehiculoResponse toVehiculo(Vehiculo v) {
        return new VehiculoResponse(v.getId(), v.getCliente().getId(), v.getCliente().getNombre(), v.getPatente(),
                v.getMarca(), v.getModelo(), v.getAnio(), v.getKm());
    }
}
