package com.stockapi.repository;

import com.stockapi.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    /** Busca por nombre, teléfono, documento o patente de alguno de sus vehículos. */
    @Query("SELECT DISTINCT c FROM Cliente c LEFT JOIN c.vehiculos v " +
           "WHERE c.activo = true AND (:q = '' " +
           "OR LOWER(c.nombre) LIKE CONCAT('%', :q, '%') " +
           "OR LOWER(COALESCE(c.telefono, '')) LIKE CONCAT('%', :q, '%') " +
           "OR LOWER(COALESCE(c.documento, '')) LIKE CONCAT('%', :q, '%') " +
           "OR LOWER(v.patente) LIKE CONCAT('%', :q, '%')) " +
           "ORDER BY c.nombre")
    List<Cliente> buscar(@Param("q") String q);
}
