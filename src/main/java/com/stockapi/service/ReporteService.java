package com.stockapi.service;

import com.stockapi.dto.producto.ProductoResponse;
import com.stockapi.dto.reporte.ProductoMasVendidoResponse;
import com.stockapi.dto.reporte.ReporteVentasResponse;
import com.stockapi.repository.ProductoRepository;
import com.stockapi.repository.TransaccionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReporteService {

    private final TransaccionRepository transaccionRepository;
    private final ProductoRepository productoRepository;
    private final ProductoService productoService;

    @Transactional(readOnly = true)
    public ReporteVentasResponse reporteVentas(LocalDate desde, LocalDate hasta) {
        LocalDateTime desdeDateTime = desde.atStartOfDay();
        LocalDateTime hastaDateTime = hasta.atTime(23, 59, 59);

        BigDecimal totalVentas = transaccionRepository.sumTotalByPeriodo(desdeDateTime, hastaDateTime);
        Long cantidadTransacciones = transaccionRepository.countByPeriodo(desdeDateTime, hastaDateTime);
        List<Object[]> rawProductos = transaccionRepository.findProductosMasVendidos(desdeDateTime, hastaDateTime);

        List<ProductoMasVendidoResponse> productosMasVendidos = rawProductos.stream()
                .map(row -> new ProductoMasVendidoResponse((String) row[0], (Long) row[1]))
                .collect(Collectors.toList());

        ReporteVentasResponse reporte = new ReporteVentasResponse();
        ReporteVentasResponse.PeriodoInfo periodo = new ReporteVentasResponse.PeriodoInfo();
        periodo.setDesde(desde.toString());
        periodo.setHasta(hasta.toString());
        reporte.setPeriodo(periodo);
        reporte.setTotalVentas(totalVentas != null ? totalVentas : BigDecimal.ZERO);
        reporte.setCantidadTransacciones(cantidadTransacciones != null ? cantidadTransacciones : 0L);
        reporte.setProductosMasVendidos(productosMasVendidos);

        return reporte;
    }

    @Transactional(readOnly = true)
    public List<ProductoResponse> reporteStock() {
        return productoRepository.findAll().stream()
                .map(p -> {
                    ProductoResponse r = productoService.toResponse(p);
                    r.setValorInventario(p.getPrecioCosto().multiply(BigDecimal.valueOf(p.getStockActual())));
                    return r;
                })
                .collect(Collectors.toList());
    }
}
