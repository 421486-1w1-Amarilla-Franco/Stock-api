package com.stockapi.service;

import com.stockapi.dto.compra.*;
import com.stockapi.exception.ConflictException;
import com.stockapi.exception.ResourceNotFoundException;
import com.stockapi.model.*;
import com.stockapi.repository.CompraRepository;
import com.stockapi.repository.ProductoRepository;
import com.stockapi.repository.ProveedorRepository;
import com.stockapi.security.UsuarioActual;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CompraService {

    private final ProveedorRepository proveedorRepository;
    private final CompraRepository compraRepository;
    private final ProductoRepository productoRepository;
    private final MovimientoService movimientoService;
    private final UsuarioActual usuarioActual;

    // ---------- Proveedores ----------

    @Transactional(readOnly = true)
    public List<ProveedorResponse> listarProveedores() {
        return proveedorRepository.findAllByOrderByNombreAsc().stream().map(CompraService::toProveedor).toList();
    }

    @Transactional
    public ProveedorResponse crearProveedor(ProveedorRequest req) {
        Proveedor p = new Proveedor();
        mapProveedor(p, req);
        return toProveedor(proveedorRepository.save(p));
    }

    @Transactional
    public ProveedorResponse actualizarProveedor(Long id, ProveedorRequest req) {
        Proveedor p = findProveedor(id);
        mapProveedor(p, req);
        return toProveedor(p);
    }

    @Transactional
    public void desactivarProveedor(Long id) {
        findProveedor(id).setActivo(false);
    }

    // ---------- Compras ----------

    @Transactional(readOnly = true)
    public List<CompraResponse> listar() {
        return compraRepository.findAllByOrderByFechaDesc().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public CompraResponse obtener(Long id) {
        return toResponse(findCompra(id));
    }

    /** Crea la orden de compra en estado PENDIENTE. El stock sube recién al recibirla. */
    @Transactional
    public CompraResponse crear(CompraRequest req) {
        Proveedor proveedor = findProveedor(req.proveedorId());
        if (!Boolean.TRUE.equals(proveedor.getActivo())) {
            throw new ConflictException("El proveedor " + proveedor.getNombre() + " está dado de baja.");
        }
        Compra c = new Compra();
        c.setProveedor(proveedor);
        c.setUsuario(usuarioActual.get());
        c.setComprobante(blank(req.comprobante()));
        c.setObservaciones(blank(req.observaciones()));
        BigDecimal total = BigDecimal.ZERO;
        for (CompraRequest.Linea l : req.detalles()) {
            Producto producto = productoRepository.findById(l.productoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con id: " + l.productoId()));
            DetalleCompra d = new DetalleCompra();
            d.setCompra(c);
            d.setProducto(producto);
            d.setCantidad(l.cantidad());
            d.setCostoUnitario(l.costoUnitario());
            c.getDetalles().add(d);
            total = total.add(l.costoUnitario().multiply(BigDecimal.valueOf(l.cantidad())));
        }
        c.setTotal(total);
        return toResponse(compraRepository.save(c));
    }

    /** Recibe la mercadería: suma stock (con movimiento ENTRADA) y actualiza el costo al último pagado. */
    @Transactional
    public CompraResponse recibir(Long id) {
        Compra c = findCompra(id);
        if (c.getEstado() != Compra.Estado.PENDIENTE) {
            throw new ConflictException("La compra #" + id + " ya está " + c.getEstado().name().toLowerCase() + ".");
        }
        Usuario usuario = usuarioActual.get();
        List<DetalleCompra> lineas = c.getDetalles().stream()
                .sorted(Comparator.comparing(d -> d.getProducto().getId())).toList();
        for (DetalleCompra d : lineas) {
            Producto p = productoRepository.findByIdForUpdate(d.getProducto().getId()).orElseThrow();
            int anterior = p.getStockActual();
            int posterior = anterior + d.getCantidad();
            p.setStockActual(posterior);
            p.setPrecioCosto(d.getCostoUnitario());
            movimientoService.registrarMovimientoInterno(p, usuario, Movimiento.TipoMovimiento.ENTRADA, d.getCantidad(),
                    "Compra #" + c.getId() + " · " + c.getProveedor().getNombre(), anterior, posterior);
        }
        c.setEstado(Compra.Estado.RECIBIDA);
        c.setRecibidaEn(LocalDateTime.now());
        return toResponse(c);
    }

    @Transactional
    public CompraResponse anular(Long id) {
        Compra c = findCompra(id);
        if (c.getEstado() != Compra.Estado.PENDIENTE) {
            throw new ConflictException("Solo se pueden anular compras pendientes.");
        }
        c.setEstado(Compra.Estado.ANULADA);
        return toResponse(c);
    }

    /** Lo que hay que pedir: productos activos en o bajo el mínimo, para volver a 2× el mínimo. */
    @Transactional(readOnly = true)
    public List<SugerenciaCompraResponse> sugerencias() {
        return productoRepository.findProductosBajoStock().stream()
                .sorted(Comparator.comparing(Producto::getNombre))
                .map(p -> new SugerenciaCompraResponse(p.getId(), p.getNombre(), p.getCodigo(), p.getStockActual(),
                        p.getStockMinimo(), Math.max(1, p.getStockMinimo() * 2 - p.getStockActual()), p.getPrecioCosto()))
                .toList();
    }

    private Proveedor findProveedor(Long id) {
        return proveedorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Proveedor no encontrado con id: " + id));
    }

    private Compra findCompra(Long id) {
        return compraRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Compra no encontrada con id: " + id));
    }

    private static void mapProveedor(Proveedor p, ProveedorRequest r) {
        p.setNombre(r.nombre().trim());
        p.setCuit(blank(r.cuit()));
        p.setTelefono(blank(r.telefono()));
        p.setEmail(blank(r.email()));
    }

    private static String blank(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static ProveedorResponse toProveedor(Proveedor p) {
        return new ProveedorResponse(p.getId(), p.getNombre(), p.getCuit(), p.getTelefono(), p.getEmail(), p.getActivo());
    }

    private CompraResponse toResponse(Compra c) {
        List<CompraResponse.Linea> lineas = c.getDetalles().stream().map(d -> new CompraResponse.Linea(
                d.getProducto().getId(), d.getProducto().getNombre(), d.getProducto().getCodigo(), d.getCantidad(),
                d.getCostoUnitario(), d.getCostoUnitario().multiply(BigDecimal.valueOf(d.getCantidad())))).toList();
        return new CompraResponse(c.getId(), c.getProveedor().getId(), c.getProveedor().getNombre(),
                c.getUsuario().getNombre(), c.getEstado().name(), c.getComprobante(), c.getObservaciones(),
                c.getTotal(), c.getFecha(), c.getRecibidaEn(), lineas);
    }
}
