package com.stockapi.service;

import com.stockapi.dto.caja.CajaResponse;
import com.stockapi.dto.caja.CierreRequest;
import com.stockapi.dto.caja.CierreResponse;
import com.stockapi.exception.ConflictException;
import com.stockapi.model.CierreCaja;
import com.stockapi.model.Transaccion;
import com.stockapi.repository.CierreCajaRepository;
import com.stockapi.repository.TransaccionRepository;
import com.stockapi.security.UsuarioActual;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CajaService {

    private final TransaccionRepository transaccionRepository;
    private final CierreCajaRepository cierreCajaRepository;
    private final UsuarioActual usuarioActual;

    @Transactional(readOnly = true)
    public CajaResponse resumen(LocalDate fecha) {
        Totales t = totales(fecha);
        CierreResponse cierre = cierreCajaRepository.findByFecha(fecha).map(CajaService::toResponse).orElse(null);
        return new CajaResponse(fecha, t.cantidad, t.total, t.porMedio, cierre);
    }

    /** Cierra el día: congela lo vendido por medio de pago y registra el efectivo contado. */
    @Transactional
    public CierreResponse cerrar(CierreRequest req) {
        if (req.fecha().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("No se puede cerrar un día futuro.");
        }
        if (cierreCajaRepository.findByFecha(req.fecha()).isPresent()) {
            throw new ConflictException("La caja del " + req.fecha() + " ya está cerrada.");
        }
        Totales t = totales(req.fecha());
        CierreCaja c = new CierreCaja();
        c.setFecha(req.fecha());
        c.setUsuario(usuarioActual.get());
        c.setCantidadVentas((int) t.cantidad);
        c.setTotalEfectivo(t.porMedio.get("EFECTIVO"));
        c.setTotalDebito(t.porMedio.get("DEBITO"));
        c.setTotalCredito(t.porMedio.get("CREDITO"));
        c.setTotalTransferencia(t.porMedio.get("TRANSFERENCIA"));
        c.setEfectivoContado(req.efectivoContado());
        c.setDiferencia(req.efectivoContado().subtract(c.getTotalEfectivo()));
        c.setObservaciones(req.observaciones() == null || req.observaciones().isBlank() ? null : req.observaciones().trim());
        return toResponse(cierreCajaRepository.save(c));
    }

    @Transactional(readOnly = true)
    public List<CierreResponse> historial() {
        return cierreCajaRepository.findTop60ByOrderByFechaDesc().stream().map(CajaService::toResponse).toList();
    }

    private record Totales(long cantidad, BigDecimal total, Map<String, BigDecimal> porMedio) {
    }

    private Totales totales(LocalDate fecha) {
        Map<String, BigDecimal> porMedio = new LinkedHashMap<>();
        for (Transaccion.MedioPago m : Transaccion.MedioPago.values()) porMedio.put(m.name(), BigDecimal.ZERO);
        long cantidad = 0;
        BigDecimal total = BigDecimal.ZERO;
        for (Object[] row : transaccionRepository.totalesPorMedioPago(fecha.atStartOfDay(), fecha.atTime(23, 59, 59, 999_999_999))) {
            BigDecimal monto = (BigDecimal) row[1];
            porMedio.put(((Transaccion.MedioPago) row[0]).name(), monto);
            cantidad += (Long) row[2];
            total = total.add(monto);
        }
        return new Totales(cantidad, total, porMedio);
    }

    private static CierreResponse toResponse(CierreCaja c) {
        return new CierreResponse(c.getId(), c.getFecha(), c.getUsuario().getNombre(), c.getCantidadVentas(),
                c.getTotalEfectivo(), c.getTotalDebito(), c.getTotalCredito(), c.getTotalTransferencia(),
                c.getEfectivoContado(), c.getDiferencia(), c.getObservaciones(), c.getCreadoEn());
    }
}
