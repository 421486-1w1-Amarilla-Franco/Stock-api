package com.stockapi.service;

import com.stockapi.dto.movimiento.MovimientoRequest;
import com.stockapi.dto.movimiento.MovimientoResponse;
import com.stockapi.exception.ResourceNotFoundException;
import com.stockapi.exception.StockInsuficienteException;
import com.stockapi.model.Movimiento;
import com.stockapi.model.Producto;
import com.stockapi.model.Usuario;
import com.stockapi.repository.MovimientoRepository;
import com.stockapi.repository.ProductoRepository;
import com.stockapi.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MovimientoService {

    private final MovimientoRepository movimientoRepository;
    private final ProductoRepository productoRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public List<MovimientoResponse> listarTodos() {
        return movimientoRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MovimientoResponse> listarPorProducto(Long productoId) {
        return movimientoRepository.findByProductoIdOrderByFechaDesc(productoId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public MovimientoResponse registrar(MovimientoRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        Producto producto = productoRepository.findById(request.getProductoId())
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con id: " + request.getProductoId()));

        int stockAnterior = producto.getStockActual();
        int stockPosterior = calcularStockPosterior(producto, request.getTipo(), request.getCantidad(), stockAnterior);

        producto.setStockActual(stockPosterior);
        productoRepository.save(producto);

        Movimiento movimiento = buildMovimiento(producto, usuario, request.getTipo(), request.getCantidad(),
                request.getNota(), stockAnterior, stockPosterior);

        return toResponse(movimientoRepository.save(movimiento));
    }

    @Transactional
    public void registrarMovimientoInterno(Producto producto, Usuario usuario,
            Movimiento.TipoMovimiento tipo, int cantidad, String nota, int stockAnterior, int stockPosterior) {
        movimientoRepository.save(buildMovimiento(producto, usuario, tipo, cantidad, nota, stockAnterior, stockPosterior));
    }

    private int calcularStockPosterior(Producto producto, Movimiento.TipoMovimiento tipo, int cantidad, int stockAnterior) {
        return switch (tipo) {
            case ENTRADA -> stockAnterior + cantidad;
            case SALIDA -> {
                if (stockAnterior < cantidad) {
                    throw new StockInsuficienteException(producto.getNombre(), stockAnterior, cantidad);
                }
                yield stockAnterior - cantidad;
            }
            case AJUSTE -> cantidad;
        };
    }

    private Movimiento buildMovimiento(Producto producto, Usuario usuario, Movimiento.TipoMovimiento tipo,
            int cantidad, String nota, int stockAnterior, int stockPosterior) {
        Movimiento m = new Movimiento();
        m.setProducto(producto);
        m.setUsuario(usuario);
        m.setTipo(tipo);
        m.setCantidad(cantidad);
        m.setNota(nota);
        m.setStockAnterior(stockAnterior);
        m.setStockPosterior(stockPosterior);
        return m;
    }

    private MovimientoResponse toResponse(Movimiento m) {
        MovimientoResponse r = new MovimientoResponse();
        r.setId(m.getId());
        r.setProductoId(m.getProducto().getId());
        r.setProductoNombre(m.getProducto().getNombre());
        r.setUsuarioId(m.getUsuario().getId());
        r.setUsuarioNombre(m.getUsuario().getNombre());
        r.setTipo(m.getTipo().name());
        r.setCantidad(m.getCantidad());
        r.setNota(m.getNota());
        r.setStockAnterior(m.getStockAnterior());
        r.setStockPosterior(m.getStockPosterior());
        r.setFecha(m.getFecha());
        return r;
    }
}
