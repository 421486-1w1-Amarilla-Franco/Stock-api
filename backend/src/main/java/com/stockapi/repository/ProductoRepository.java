package com.stockapi.repository;

import com.stockapi.model.Producto;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {

    List<Producto> findByActivoTrue();

    List<Producto> findByCategoriaAndActivoTrue(Producto.Categoria categoria);

    // Productos con stock por debajo del mínimo
    @Query("SELECT p FROM Producto p WHERE p.stockActual <= p.stockMinimo AND p.activo = true")
    List<Producto> findProductosBajoStock();

    @Query("SELECT COUNT(p) FROM Producto p WHERE p.stockActual <= p.stockMinimo AND p.activo = true")
    long countBajoStock();

    @Query("SELECT COALESCE(SUM(p.precioCosto * p.stockActual), 0) FROM Producto p WHERE p.activo = true")
    java.math.BigDecimal valorInventarioCosto();

    @Query("SELECT COALESCE(SUM(p.precioVenta * p.stockActual), 0) FROM Producto p WHERE p.activo = true")
    java.math.BigDecimal valorInventarioVenta();

    /**
     * Lectura con bloqueo de fila (SELECT ... FOR UPDATE) para operaciones que
     * cambian stock: dos ventas simultáneas del mismo producto se serializan.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Producto p WHERE p.id = :id")
    Optional<Producto> findByIdForUpdate(@Param("id") Long id);

    Optional<Producto> findByCodigo(String codigo);

    boolean existsByCodigo(String codigo);

    boolean existsByCodigoAndIdNot(String codigo, Long id);
}
