package com.stockapi.service;

import com.stockapi.dto.producto.ProductoResponse;
import com.stockapi.dto.reporte.ProductoMasVendidoResponse;
import com.stockapi.dto.reporte.ReporteVentasResponse;
import com.stockapi.dto.reporte.ResumenResponse;
import com.stockapi.repository.ProductoRepository;
import com.stockapi.repository.TransaccionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
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
                .map(row -> new ProductoMasVendidoResponse(
                        (String) row[0],
                        (Long) row[1],
                        row[2] != null ? (BigDecimal) row[2] : BigDecimal.ZERO))
                .collect(Collectors.toList());

        List<BigDecimal> ventasDiarias = buildVentasDiarias(desde, hasta, desdeDateTime, hastaDateTime);

        ReporteVentasResponse reporte = new ReporteVentasResponse();
        ReporteVentasResponse.PeriodoInfo periodo = new ReporteVentasResponse.PeriodoInfo();
        periodo.setDesde(desde.toString());
        periodo.setHasta(hasta.toString());
        reporte.setPeriodo(periodo);
        reporte.setTotalVentas(totalVentas != null ? totalVentas : BigDecimal.ZERO);
        reporte.setCantidadTransacciones(cantidadTransacciones != null ? cantidadTransacciones : 0L);
        reporte.setProductosMasVendidos(productosMasVendidos);
        reporte.setVentasDiarias(ventasDiarias);
        BigDecimal costo = transaccionRepository.sumCostoByPeriodo(desdeDateTime, hastaDateTime);
        reporte.setCostoMercaderia(costo);
        reporte.setManoObra(transaccionRepository.sumManoObraByPeriodo(desdeDateTime, hastaDateTime));
        reporte.setMargen(reporte.getTotalVentas().subtract(costo));

        return reporte;
    }

    /** KPIs del dashboard en una consulta: período de `dias` hasta hoy contra el período previo de igual largo. */
    @Transactional(readOnly = true)
    public ResumenResponse resumen(int dias) {
        if (dias < 1 || dias > 366) throw new IllegalArgumentException("dias debe estar entre 1 y 366");
        LocalDate hasta = LocalDate.now();
        LocalDate desde = hasta.minusDays(dias - 1L);
        LocalDateTime d = desde.atStartOfDay(), h = hasta.atTime(23, 59, 59);
        LocalDateTime dPrev = desde.minusDays(dias).atStartOfDay(), hPrev = desde.minusDays(1).atTime(23, 59, 59);

        BigDecimal ventas = transaccionRepository.sumTotalByPeriodo(d, h);
        BigDecimal ventasPrev = transaccionRepository.sumTotalByPeriodo(dPrev, hPrev);
        BigDecimal margen = ventas.subtract(transaccionRepository.sumCostoByPeriodo(d, h));
        BigDecimal margenPrev = ventasPrev.subtract(transaccionRepository.sumCostoByPeriodo(dPrev, hPrev));

        List<ProductoMasVendidoResponse> top = transaccionRepository.findProductosMasVendidos(d, h).stream()
                .limit(5)
                .map(row -> new ProductoMasVendidoResponse((String) row[0], (Long) row[1],
                        row[2] != null ? (BigDecimal) row[2] : BigDecimal.ZERO))
                .toList();

        LocalDateTime hoy = hasta.atStartOfDay();
        return new ResumenResponse(desde, hasta,
                ventas, ventasPrev,
                transaccionRepository.countByPeriodo(d, h), transaccionRepository.countByPeriodo(dPrev, hPrev),
                margen, margenPrev,
                transaccionRepository.countByPeriodo(hoy, h), transaccionRepository.sumTotalByPeriodo(hoy, h),
                productoRepository.countBajoStock(),
                productoRepository.valorInventarioCosto(), productoRepository.valorInventarioVenta(),
                buildVentasDiarias(desde, hasta, d, h), top);
    }

    private List<BigDecimal> buildVentasDiarias(LocalDate desde, LocalDate hasta,
                                                 LocalDateTime desdeDateTime, LocalDateTime hastaDateTime) {
        List<Object[]> raw = transaccionRepository.findVentasDiarias(desdeDateTime, hastaDateTime);

        Map<LocalDate, BigDecimal> porDia = raw.stream()
                .collect(Collectors.toMap(
                        row -> ((java.sql.Date) row[0]).toLocalDate(),
                        row -> row[1] != null ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO
                ));

        List<BigDecimal> resultado = new ArrayList<>();
        LocalDate cursor = desde;
        while (!cursor.isAfter(hasta)) {
            resultado.add(porDia.getOrDefault(cursor, BigDecimal.ZERO));
            cursor = cursor.plusDays(1);
        }
        return resultado;
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
