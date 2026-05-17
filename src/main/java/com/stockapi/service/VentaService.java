package com.stockapi.service;

import com.stockapi.dto.venta.DetalleVentaRequest;
import com.stockapi.dto.venta.VentaRequest;
import com.stockapi.dto.venta.VentaResponse;
import com.stockapi.exception.ResourceNotFoundException;
import com.stockapi.exception.StockInsuficienteException;
import com.stockapi.model.*;
import com.stockapi.repository.ProductoRepository;
import com.stockapi.repository.TransaccionRepository;
import com.stockapi.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VentaService {

    private final TransaccionRepository transaccionRepository;
    private final ProductoRepository productoRepository;
    private final UsuarioRepository usuarioRepository;
    private final MovimientoService movimientoService;

    @Transactional
    public VentaResponse crear(VentaRequest request) {
        Usuario usuario = getUsuarioAutenticado();

        Transaccion transaccion = new Transaccion();
        transaccion.setUsuario(usuario);
        transaccion.setObservaciones(request.getObservaciones());
        transaccion.setEstado(Transaccion.Estado.COMPLETADA);

        BigDecimal total = BigDecimal.ZERO;

        List<Producto> productosList = new ArrayList<>();
        List<Integer> cantidadesList = new ArrayList<>();
        List<Integer> stocksAnteriores = new ArrayList<>();

        for (DetalleVentaRequest detalleReq : request.getDetalles()) {
            Producto producto = productoRepository.findById(detalleReq.getProductoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con id: " + detalleReq.getProductoId()));

            int stockAnterior = producto.getStockActual();
            int requerido = detalleReq.getCantidad();

            if (stockAnterior < requerido) {
                throw new StockInsuficienteException(producto.getNombre(), stockAnterior, requerido);
            }

            producto.setStockActual(stockAnterior - requerido);
            productoRepository.save(producto);

            productosList.add(producto);
            cantidadesList.add(requerido);
            stocksAnteriores.add(stockAnterior);

            DetalleVenta detalle = new DetalleVenta();
            detalle.setTransaccion(transaccion);
            detalle.setProducto(producto);
            detalle.setCantidad(requerido);
            detalle.setPrecioUnitario(producto.getPrecioVenta());
            detalle.calcularSubtotal();

            transaccion.getDetalles().add(detalle);
            total = total.add(detalle.getSubtotal());
        }

        transaccion.setTotal(total);
        Transaccion saved = transaccionRepository.save(transaccion);

        for (int i = 0; i < productosList.size(); i++) {
            movimientoService.registrarMovimientoInterno(
                    productosList.get(i), usuario,
                    Movimiento.TipoMovimiento.SALIDA,
                    cantidadesList.get(i),
                    "Venta #" + saved.getId(),
                    stocksAnteriores.get(i),
                    stocksAnteriores.get(i) - cantidadesList.get(i)
            );
        }

        return toResponse(saved);
    }

    @Transactional
    public VentaResponse actualizarEstado(Long id, String nuevoEstado) {
        Transaccion transaccion = findById(id);

        Transaccion.Estado estado;
        try {
            estado = Transaccion.Estado.valueOf(nuevoEstado);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Estado inválido: " + nuevoEstado);
        }

        if (estado == Transaccion.Estado.ANULADA) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            boolean esAdmin = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            if (!esAdmin) {
                throw new AccessDeniedException("Solo los administradores pueden anular ventas");
            }

            if (transaccion.getEstado() == Transaccion.Estado.COMPLETADA) {
                Usuario usuario = getUsuarioAutenticado();
                for (DetalleVenta detalle : transaccion.getDetalles()) {
                    Producto producto = detalle.getProducto();
                    int stockAnterior = producto.getStockActual();
                    int stockPosterior = stockAnterior + detalle.getCantidad();
                    producto.setStockActual(stockPosterior);
                    productoRepository.save(producto);
                    movimientoService.registrarMovimientoInterno(
                            producto, usuario,
                            Movimiento.TipoMovimiento.ENTRADA,
                            detalle.getCantidad(),
                            "Anulación venta #" + transaccion.getId(),
                            stockAnterior,
                            stockPosterior
                    );
                }
            }
        }

        if (estado == Transaccion.Estado.COMPLETADA && transaccion.getEstado() == Transaccion.Estado.PENDIENTE) {
            Usuario usuario = getUsuarioAutenticado();

            for (DetalleVenta detalle : transaccion.getDetalles()) {
                Producto producto = detalle.getProducto();
                int stockAnterior = producto.getStockActual();
                int requerido = detalle.getCantidad();

                if (stockAnterior < requerido) {
                    throw new StockInsuficienteException(producto.getNombre(), stockAnterior, requerido);
                }

                int stockPosterior = stockAnterior - requerido;
                producto.setStockActual(stockPosterior);
                productoRepository.save(producto);

                movimientoService.registrarMovimientoInterno(
                        producto, usuario,
                        Movimiento.TipoMovimiento.SALIDA,
                        requerido,
                        "Venta #" + transaccion.getId(),
                        stockAnterior,
                        stockPosterior
                );
            }
        }

        transaccion.setEstado(estado);
        return toResponse(transaccionRepository.save(transaccion));
    }

    @Transactional(readOnly = true)
    public VentaResponse obtenerPorId(Long id) {
        return toResponse(findById(id));
    }

    @Transactional(readOnly = true)
    public List<VentaResponse> listarTodas() {
        return transaccionRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private Transaccion findById(Long id) {
        return transaccionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Venta no encontrada con id: " + id));
    }

    private Usuario getUsuarioAutenticado() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }

    private VentaResponse toResponse(Transaccion t) {
        VentaResponse r = new VentaResponse();
        r.setId(t.getId());
        r.setUsuarioId(t.getUsuario().getId());
        r.setUsuarioNombre(t.getUsuario().getNombre());
        r.setTotal(t.getTotal());
        r.setEstado(t.getEstado().name());
        r.setObservaciones(t.getObservaciones());
        r.setFecha(t.getFecha());
        r.setDetalles(t.getDetalles().stream().map(d -> {
            VentaResponse.DetalleVentaResponse dr = new VentaResponse.DetalleVentaResponse();
            dr.setId(d.getId());
            dr.setProductoId(d.getProducto().getId());
            dr.setProductoNombre(d.getProducto().getNombre());
            dr.setProductoCodigo(d.getProducto().getCodigo());
            dr.setCantidad(d.getCantidad());
            dr.setPrecioUnitario(d.getPrecioUnitario());
            dr.setSubtotal(d.getSubtotal());
            return dr;
        }).collect(Collectors.toList()));
        return r;
    }
}
