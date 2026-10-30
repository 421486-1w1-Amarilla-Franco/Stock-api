package com.stockapi.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "cierres_caja")
@Getter
@Setter
@NoArgsConstructor
public class CierreCaja {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private LocalDate fecha;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(nullable = false)
    private Integer cantidadVentas;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalEfectivo;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalDebito;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalCredito;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalTransferencia;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal efectivoContado;

    /** efectivoContado - totalEfectivo. Negativo = falta plata. */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal diferencia;

    @Column(length = 255)
    private String observaciones;

    @Column(nullable = false, updatable = false)
    private LocalDateTime creadoEn = LocalDateTime.now();
}
