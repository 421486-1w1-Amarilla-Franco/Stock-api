package com.stockapi.repository;

import com.stockapi.model.Transaccion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransaccionRepository extends JpaRepository<Transaccion, Long>, JpaSpecificationExecutor<Transaccion> {

    List<Transaccion> findByFechaBetweenOrderByFechaDesc(LocalDateTime desde, LocalDateTime hasta);

    List<Transaccion> findByEstado(Transaccion.Estado estado);

    @Override
    @EntityGraph(attributePaths = {"usuario", "cliente", "vehiculo"})
    Page<Transaccion> findAll(Specification<Transaccion> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"usuario", "cliente", "vehiculo"})
    List<Transaccion> findByVehiculoIdOrderByFechaDesc(Long vehiculoId);

    @EntityGraph(attributePaths = {"usuario", "cliente", "vehiculo"})
    List<Transaccion> findByClienteIdOrderByFechaDesc(Long clienteId);

    // Total de ventas en un período
    @Query("SELECT COALESCE(SUM(t.total), 0) FROM Transaccion t WHERE t.fecha BETWEEN :desde AND :hasta AND t.estado = 'COMPLETADA'")
    BigDecimal sumTotalByPeriodo(@Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);

    // Cantidad de ventas en un período
    @Query("SELECT COUNT(t) FROM Transaccion t WHERE t.fecha BETWEEN :desde AND :hasta AND t.estado = 'COMPLETADA'")
    Long countByPeriodo(@Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);

    // Costo de la mercadería vendida (al costo histórico de cada línea)
    @Query("SELECT COALESCE(SUM(d.costoUnitario * d.cantidad), 0) FROM DetalleVenta d " +
           "WHERE d.transaccion.fecha BETWEEN :desde AND :hasta AND d.transaccion.estado = 'COMPLETADA'")
    BigDecimal sumCostoByPeriodo(@Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);

    @Query("SELECT COALESCE(SUM(t.manoObra), 0) FROM Transaccion t WHERE t.fecha BETWEEN :desde AND :hasta AND t.estado = 'COMPLETADA'")
    BigDecimal sumManoObraByPeriodo(@Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);

    // Totales por medio de pago (cierre de caja): filas [MedioPago, total, cantidad]
    @Query("SELECT t.medioPago, COALESCE(SUM(t.total), 0), COUNT(t) FROM Transaccion t " +
           "WHERE t.fecha BETWEEN :desde AND :hasta AND t.estado = 'COMPLETADA' GROUP BY t.medioPago")
    List<Object[]> totalesPorMedioPago(@Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);

    // Productos más vendidos en un período (con ingresos)
    @Query("SELECT d.producto.nombre, SUM(d.cantidad) as totalVendido, SUM(d.subtotal) as totalIngresos " +
           "FROM DetalleVenta d " +
           "WHERE d.transaccion.fecha BETWEEN :desde AND :hasta " +
           "AND d.transaccion.estado = 'COMPLETADA' " +
           "GROUP BY d.producto.id, d.producto.nombre " +
           "ORDER BY totalVendido DESC")
    List<Object[]> findProductosMasVendidos(@Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);

    // Ventas diarias en un período (para el chart)
    @Query(value = "SELECT CAST(fecha AS DATE) as dia, COALESCE(SUM(total), 0) as total " +
                   "FROM transacciones " +
                   "WHERE fecha BETWEEN :desde AND :hasta AND estado = 'COMPLETADA' " +
                   "GROUP BY CAST(fecha AS DATE) " +
                   "ORDER BY CAST(fecha AS DATE) ASC",
           nativeQuery = true)
    List<Object[]> findVentasDiarias(@Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);
}
