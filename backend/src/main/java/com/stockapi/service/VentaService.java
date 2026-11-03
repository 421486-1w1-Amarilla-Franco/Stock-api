package com.stockapi.service;

import com.stockapi.dto.PageResponse;
import com.stockapi.dto.venta.DetalleVentaRequest;
import com.stockapi.dto.venta.VentaRequest;
import com.stockapi.dto.venta.VentaResponse;
import com.stockapi.exception.ConflictException;
import com.stockapi.exception.ResourceNotFoundException;
import com.stockapi.exception.StockInsuficienteException;
import com.stockapi.model.*;
import com.stockapi.repository.CierreCajaRepository;
import com.stockapi.repository.ClienteRepository;
import com.stockapi.repository.ProductoRepository;
import com.stockapi.repository.TransaccionRepository;
import com.stockapi.repository.VehiculoRepository;
import com.stockapi.security.UsuarioActual;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class VentaService {

    private final TransaccionRepository transaccionRepository;
    private final ProductoRepository productoRepository;
    private final ClienteRepository clienteRepository;
    private final VehiculoRepository vehiculoRepository;
    private final CierreCajaRepository cierreCajaRepository;
    private final MovimientoService movimientoService;
    private final UsuarioActual usuarioActual;

    @Transactional
    public VentaResponse crear(VentaRequest request) {
        Usuario usuario = usuarioActual.get();
        validarCajaAbierta(LocalDate.now(), "registrar ventas");

        Transaccion transaccion = new Transaccion();
        transaccion.setUsuario(usuario);
        transaccion.setObservaciones(blankToNull(request.getObservaciones()));
        transaccion.setEstado(Transaccion.Estado.COMPLETADA);
        transaccion.setMedioPago(request.getMedioPago() != null ? request.getMedioPago() : Transaccion.MedioPago.EFECTIVO);
        transaccion.setManoObra(request.getManoObra() != null ? request.getManoObra() : BigDecimal.ZERO);
        asignarClienteYVehiculo(transaccion, request);

        // Mismo producto en varias líneas → una sola línea con la suma (un solo descuento y movimiento).
        // Orden por id: dos ventas concurrentes bloquean filas en el mismo orden y no se traban entre sí.
        Map<Long, Integer> cantidades = new TreeMap<>();
        for (DetalleVentaRequest d : request.getDetalles()) {
            cantidades.merge(d.getProductoId(), d.getCantidad(), Integer::sum);
        }

        BigDecimal total = BigDecimal.ZERO;
        List<int[]> stocks = new ArrayList<>();
        for (Map.Entry<Long, Integer> e : cantidades.entrySet()) {
            Producto producto = productoRepository.findByIdForUpdate(e.getKey())
                    .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con id: " + e.getKey()));
            if (!Boolean.TRUE.equals(producto.getActivo())) {
                throw new ConflictException("El producto \"" + producto.getNombre() + "\" está dado de baja y no se puede vender.");
            }

            int stockAnterior = producto.getStockActual();
            int requerido = e.getValue();
            if (stockAnterior < requerido) {
                throw new StockInsuficienteException(producto.getNombre(), stockAnterior, requerido);
            }
            producto.setStockActual(stockAnterior - requerido);
            stocks.add(new int[]{stockAnterior, requerido});

            DetalleVenta detalle = new DetalleVenta();
            detalle.setTransaccion(transaccion);
            detalle.setProducto(producto);
            detalle.setCantidad(requerido);
            detalle.setPrecioUnitario(producto.getPrecioVenta());
            detalle.setCostoUnitario(producto.getPrecioCosto());
            detalle.calcularSubtotal();
            transaccion.getDetalles().add(detalle);
            total = total.add(detalle.getSubtotal());
        }

        transaccion.setTotal(total.add(transaccion.getManoObra()));
        Transaccion saved = transaccionRepository.save(transaccion);

        for (int i = 0; i < saved.getDetalles().size(); i++) {
            DetalleVenta d = saved.getDetalles().get(i);
            int[] s = stocks.get(i);
            movimientoService.registrarMovimientoInterno(d.getProducto(), usuario,
                    Movimiento.TipoMovimiento.SALIDA, s[1], "Venta #" + saved.getId(), s[0], s[0] - s[1]);
        }

        return toResponse(saved);
    }

    private void asignarClienteYVehiculo(Transaccion t, VentaRequest request) {
        Cliente cliente = null;
        if (request.getClienteId() != null) {
            cliente = clienteRepository.findById(request.getClienteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con id: " + request.getClienteId()));
        }
        if (request.getVehiculoId() != null) {
            Vehiculo vehiculo = vehiculoRepository.findById(request.getVehiculoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Vehículo no encontrado con id: " + request.getVehiculoId()));
            if (cliente != null && !vehiculo.getCliente().getId().equals(cliente.getId())) {
                throw new IllegalArgumentException("El vehículo " + vehiculo.getPatente() + " no pertenece al cliente elegido.");
            }
            cliente = vehiculo.getCliente();
            t.setVehiculo(vehiculo);
            if (request.getKmVehiculo() != null) {
                t.setKmVehiculo(request.getKmVehiculo());
                if (vehiculo.getKm() == null || request.getKmVehiculo() > vehiculo.getKm()) {
                    vehiculo.setKm(request.getKmVehiculo());
                }
            }
        }
        t.setCliente(cliente);
    }

    @Transactional
    public VentaResponse actualizarEstado(Long id, String nuevoEstado) {
        Transaccion transaccion = findById(id);

        Transaccion.Estado estado;
        try {
            estado = Transaccion.Estado.valueOf(nuevoEstado);
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new IllegalArgumentException("Estado inválido: " + nuevoEstado);
        }
        if (estado == transaccion.getEstado()) {
            return toResponse(transaccion);
        }
        if (transaccion.getEstado() == Transaccion.Estado.ANULADA) {
            throw new ConflictException("La venta #" + id + " ya está anulada.");
        }

        Usuario usuario = usuarioActual.get();

        if (estado == Transaccion.Estado.ANULADA) {
            if (!usuarioActual.esAdmin()) {
                throw new AccessDeniedException("Solo los administradores pueden anular ventas");
            }
            validarCajaAbierta(transaccion.getFecha().toLocalDate(), "anular ventas de ese día");
            if (transaccion.getEstado() == Transaccion.Estado.COMPLETADA) {
                for (DetalleVenta detalle : ordenadoPorProducto(transaccion)) {
                    Producto producto = bloquear(detalle.getProducto().getId());
                    int stockAnterior = producto.getStockActual();
                    int stockPosterior = stockAnterior + detalle.getCantidad();
                    producto.setStockActual(stockPosterior);
                    movimientoService.registrarMovimientoInterno(producto, usuario,
                            Movimiento.TipoMovimiento.ENTRADA, detalle.getCantidad(),
                            "Anulación venta #" + transaccion.getId(), stockAnterior, stockPosterior);
                }
            }
        }

        if (estado == Transaccion.Estado.COMPLETADA && transaccion.getEstado() == Transaccion.Estado.PENDIENTE) {
            for (DetalleVenta detalle : ordenadoPorProducto(transaccion)) {
                Producto producto = bloquear(detalle.getProducto().getId());
                int stockAnterior = producto.getStockActual();
                int requerido = detalle.getCantidad();
                if (stockAnterior < requerido) {
                    throw new StockInsuficienteException(producto.getNombre(), stockAnterior, requerido);
                }
                int stockPosterior = stockAnterior - requerido;
                producto.setStockActual(stockPosterior);
                movimientoService.registrarMovimientoInterno(producto, usuario,
                        Movimiento.TipoMovimiento.SALIDA, requerido,
                        "Venta #" + transaccion.getId(), stockAnterior, stockPosterior);
            }
        }

        transaccion.setEstado(estado);
        return toResponse(transaccionRepository.save(transaccion));
    }

    /** Un día con caja cerrada queda congelado: sus totales ya se rindieron. */
    private void validarCajaAbierta(LocalDate dia, String accion) {
        if (cierreCajaRepository.findByFecha(dia).isPresent()) {
            throw new ConflictException("La caja del " + dia + " ya está cerrada: no se pueden " + accion + ".");
        }
    }

    private Producto bloquear(Long productoId) {
        return productoRepository.findByIdForUpdate(productoId)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con id: " + productoId));
    }

    private static List<DetalleVenta> ordenadoPorProducto(Transaccion t) {
        return t.getDetalles().stream()
                .sorted(Comparator.comparing(d -> d.getProducto().getId()))
                .toList();
    }

    @Transactional(readOnly = true)
    public VentaResponse obtenerPorId(Long id) {
        return toResponse(findById(id));
    }

    /** Listado paginado. q busca por número de venta, observaciones, cliente o patente. */
    @Transactional(readOnly = true)
    public PageResponse<VentaResponse> buscar(String q, Transaccion.Estado estado, Transaccion.MedioPago medioPago,
                                              LocalDate desde, LocalDate hasta, Pageable pageable) {
        Specification<Transaccion> spec = (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            if (estado != null) ps.add(cb.equal(root.get("estado"), estado));
            if (medioPago != null) ps.add(cb.equal(root.get("medioPago"), medioPago));
            if (desde != null) ps.add(cb.greaterThanOrEqualTo(root.<LocalDateTime>get("fecha"), desde.atStartOfDay()));
            if (hasta != null) ps.add(cb.lessThan(root.<LocalDateTime>get("fecha"), hasta.plusDays(1).atStartOfDay()));
            if (q != null && !q.isBlank()) {
                String texto = q.trim().toLowerCase().replaceFirst("^#", "");
                String like = "%" + texto + "%";
                var cliente = root.join("cliente", JoinType.LEFT);
                var vehiculo = root.join("vehiculo", JoinType.LEFT);
                List<Predicate> or = new ArrayList<>(List.of(
                        cb.like(cb.lower(cb.coalesce(root.<String>get("observaciones"), "")), like),
                        cb.like(cb.lower(cb.coalesce(cliente.<String>get("nombre"), "")), like),
                        cb.like(cb.lower(cb.coalesce(vehiculo.<String>get("patente"), "")), like)));
                if (texto.matches("\\d{1,18}")) or.add(cb.equal(root.get("id"), Long.parseLong(texto)));
                ps.add(cb.or(or.toArray(Predicate[]::new)));
            }
            return cb.and(ps.toArray(Predicate[]::new));
        };
        Pageable ordenado = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                Sort.by(Sort.Direction.DESC, "fecha", "id"));
        return PageResponse.of(transaccionRepository.findAll(spec, ordenado), this::toResponse);
    }

    @Transactional(readOnly = true)
    public List<VentaResponse> listarPorVehiculo(Long vehiculoId) {
        return transaccionRepository.findByVehiculoIdOrderByFechaDesc(vehiculoId).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<VentaResponse> listarPorCliente(Long clienteId) {
        return transaccionRepository.findByClienteIdOrderByFechaDesc(clienteId).stream().map(this::toResponse).toList();
    }

    private Transaccion findById(Long id) {
        return transaccionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Venta no encontrada con id: " + id));
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    VentaResponse toResponse(Transaccion t) {
        VentaResponse r = new VentaResponse();
        r.setId(t.getId());
        r.setUsuarioId(t.getUsuario().getId());
        r.setUsuarioNombre(t.getUsuario().getNombre());
        r.setTotal(t.getTotal());
        r.setEstado(t.getEstado().name());
        r.setObservaciones(t.getObservaciones());
        r.setFecha(t.getFecha());
        r.setMedioPago(t.getMedioPago().name());
        r.setManoObra(t.getManoObra());
        r.setKmVehiculo(t.getKmVehiculo());
        if (t.getCliente() != null) {
            r.setClienteId(t.getCliente().getId());
            r.setClienteNombre(t.getCliente().getNombre());
        }
        if (t.getVehiculo() != null) {
            Vehiculo v = t.getVehiculo();
            r.setVehiculoId(v.getId());
            r.setVehiculoPatente(v.getPatente());
            r.setVehiculoDescripcion(String.join(" ", Objects.toString(v.getMarca(), ""), Objects.toString(v.getModelo(), "")).trim());
        }
        BigDecimal costo = BigDecimal.ZERO;
        int items = 0;
        List<VentaResponse.DetalleVentaResponse> detalles = new ArrayList<>();
        for (DetalleVenta d : t.getDetalles()) {
            VentaResponse.DetalleVentaResponse dr = new VentaResponse.DetalleVentaResponse();
            dr.setId(d.getId());
            dr.setProductoId(d.getProducto().getId());
            dr.setProductoNombre(d.getProducto().getNombre());
            dr.setProductoCodigo(d.getProducto().getCodigo());
            dr.setCantidad(d.getCantidad());
            dr.setPrecioUnitario(d.getPrecioUnitario());
            dr.setCostoUnitario(d.getCostoUnitario());
            dr.setSubtotal(d.getSubtotal());
            detalles.add(dr);
            costo = costo.add(d.getCostoUnitario().multiply(BigDecimal.valueOf(d.getCantidad())));
            items += d.getCantidad();
        }
        r.setDetalles(detalles);
        r.setCantidadItems(items);
        r.setMargen(t.getTotal().subtract(costo));
        return r;
    }
}
