package com.stockapi.repository;

import com.stockapi.model.CierreCaja;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CierreCajaRepository extends JpaRepository<CierreCaja, Long> {

    Optional<CierreCaja> findByFecha(LocalDate fecha);

    @EntityGraph(attributePaths = {"usuario"})
    List<CierreCaja> findTop60ByOrderByFechaDesc();
}
