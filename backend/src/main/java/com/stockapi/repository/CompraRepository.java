package com.stockapi.repository;

import com.stockapi.model.Compra;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompraRepository extends JpaRepository<Compra, Long> {

    @EntityGraph(attributePaths = {"proveedor", "usuario"})
    List<Compra> findAllByOrderByFechaDesc();
}
