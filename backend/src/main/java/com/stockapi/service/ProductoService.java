package com.stockapi.service;

import com.stockapi.dto.producto.ProductoRequest;
import com.stockapi.dto.producto.ProductoResponse;
import com.stockapi.exception.ConflictException;
import com.stockapi.exception.ResourceNotFoundException;
import com.stockapi.model.Movimiento;
import com.stockapi.model.Producto;
import com.stockapi.repository.ProductoRepository;
import com.stockapi.security.UsuarioActual;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final MovimientoService movimientoService;
    private final UsuarioActual usuarioActual;

    @Transactional(readOnly = true)
    public List<ProductoResponse> listarTodos(boolean incluirInactivos) {
        List<Producto> productos = incluirInactivos
                ? productoRepository.findAll()
                : productoRepository.findByActivoTrue();
        return productos.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProductoResponse restaurar(Long id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con id: " + id));
        producto.setActivo(true);
        return toResponse(productoRepository.save(producto));
    }

    @Transactional(readOnly = true)
    public ProductoResponse obtenerPorId(Long id) {
        return toResponse(findById(id));
    }

    @Transactional(readOnly = true)
    public List<ProductoResponse> listarPorCategoria(Producto.Categoria categoria) {
        return productoRepository.findByCategoriaAndActivoTrue(categoria).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductoResponse> listarBajoStock() {
        return productoRepository.findProductosBajoStock().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProductoResponse crear(ProductoRequest request) {
        Producto producto = new Producto();
        mapFromRequest(producto, request);
        validarCodigoUnico(producto.getCodigo(), null);
        int stockInicial = request.getStockActual() != null ? request.getStockActual() : 0;
        producto.setStockActual(stockInicial);
        Producto saved = productoRepository.save(producto);
        // El stock inicial queda en el historial como cualquier otra entrada.
        if (stockInicial > 0) {
            movimientoService.registrarMovimientoInterno(saved, usuarioActual.get(),
                    Movimiento.TipoMovimiento.ENTRADA, stockInicial, "Stock inicial", 0, stockInicial);
        }
        return toResponse(saved);
    }

    /** Actualiza datos del producto. El stock NO se toca acá: solo cambia vía movimientos, ventas o compras. */
    @Transactional
    public ProductoResponse actualizar(Long id, ProductoRequest request) {
        Producto producto = findById(id);
        mapFromRequest(producto, request);
        validarCodigoUnico(producto.getCodigo(), id);
        return toResponse(productoRepository.save(producto));
    }

    @Transactional(readOnly = true)
    public ProductoResponse obtenerPorCodigo(String codigo) {
        return productoRepository.findByCodigo(normalizarCodigo(codigo))
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("No hay producto con código " + codigo));
    }

    private void validarCodigoUnico(String codigo, Long id) {
        if (codigo == null) return;
        boolean existe = id == null
                ? productoRepository.existsByCodigo(codigo)
                : productoRepository.existsByCodigoAndIdNot(codigo, id);
        if (existe) throw new ConflictException("Ya existe un producto con el código " + codigo + ".");
    }

    /** Mayúsculas y sin espacios; vacío → null (varios productos pueden no tener código). */
    static String normalizarCodigo(String codigo) {
        if (codigo == null || codigo.isBlank()) return null;
        return codigo.trim().toUpperCase();
    }

    @Transactional
    public void eliminar(Long id) {
        Producto producto = findById(id);
        producto.setActivo(false);
        productoRepository.save(producto);
    }

    public Producto findById(Long id) {
        return productoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con id: " + id));
    }

    private void mapFromRequest(Producto producto, ProductoRequest request) {
        producto.setNombre(request.getNombre().trim());
        producto.setCodigo(normalizarCodigo(request.getCodigo()));
        producto.setCategoria(request.getCategoria());
        producto.setDescripcion(request.getDescripcion());
        producto.setPrecioCosto(request.getPrecioCosto() != null ? request.getPrecioCosto() : BigDecimal.ZERO);
        producto.setPrecioVenta(request.getPrecioVenta() != null ? request.getPrecioVenta() : BigDecimal.ZERO);
        producto.setStockMinimo(request.getStockMinimo() != null ? request.getStockMinimo() : 0);
    }

    public ProductoResponse toResponse(Producto p) {
        ProductoResponse r = new ProductoResponse();
        r.setId(p.getId());
        r.setNombre(p.getNombre());
        r.setCodigo(p.getCodigo());
        r.setCategoria(p.getCategoria().name());
        r.setDescripcion(p.getDescripcion());
        r.setPrecioCosto(p.getPrecioCosto());
        r.setPrecioVenta(p.getPrecioVenta());
        r.setStockActual(p.getStockActual());
        r.setStockMinimo(p.getStockMinimo());
        r.setActivo(p.getActivo());
        r.setCreadoEn(p.getCreadoEn());
        r.setActualizadoEn(p.getActualizadoEn());
        return r;
    }
}
