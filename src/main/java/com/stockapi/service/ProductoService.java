package com.stockapi.service;

import com.stockapi.dto.producto.ProductoRequest;
import com.stockapi.dto.producto.ProductoResponse;
import com.stockapi.exception.ResourceNotFoundException;
import com.stockapi.model.Producto;
import com.stockapi.repository.ProductoRepository;
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

    @Transactional(readOnly = true)
    public List<ProductoResponse> listarTodos() {
        return productoRepository.findByActivoTrue().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
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
        return toResponse(productoRepository.save(producto));
    }

    @Transactional
    public ProductoResponse actualizar(Long id, ProductoRequest request) {
        Producto producto = findById(id);
        mapFromRequest(producto, request);
        return toResponse(productoRepository.save(producto));
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
        producto.setNombre(request.getNombre());
        producto.setCodigo(request.getCodigo());
        producto.setCategoria(request.getCategoria());
        producto.setDescripcion(request.getDescripcion());
        producto.setPrecioCosto(request.getPrecioCosto() != null ? request.getPrecioCosto() : BigDecimal.ZERO);
        producto.setPrecioVenta(request.getPrecioVenta() != null ? request.getPrecioVenta() : BigDecimal.ZERO);
        producto.setStockActual(request.getStockActual() != null ? request.getStockActual() : 0);
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
