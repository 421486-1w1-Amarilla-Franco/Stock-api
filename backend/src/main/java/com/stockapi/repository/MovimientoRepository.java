package com.stockapi.repository;

import com.stockapi.model.Movimiento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MovimientoRepository extends JpaRepository<Movimiento, Long>, JpaSpecificationExecutor<Movimiento> {

    @EntityGraph(attributePaths = {"producto", "usuario"})
    List<Movimiento> findByProductoIdOrderByFechaDesc(Long productoId);

    List<Movimiento> findByFechaBetweenOrderByFechaDesc(LocalDateTime desde, LocalDateTime hasta);

    /** Carga producto y usuario en la misma consulta (evita N+1 al mapear la página). */
    @Override
    @EntityGraph(attributePaths = {"producto", "usuario"})
    Page<Movimiento> findAll(Specification<Movimiento> spec, Pageable pageable);

    long countByTipo(Movimiento.TipoMovimiento tipo);
}
