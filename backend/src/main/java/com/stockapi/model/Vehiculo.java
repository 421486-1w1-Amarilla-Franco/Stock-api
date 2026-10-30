package com.stockapi.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "vehiculos")
@Getter
@Setter
@NoArgsConstructor
public class Vehiculo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    /** Normalizada: mayúsculas, sin espacios ni guiones. */
    @Column(nullable = false, length = 10)
    private String patente;

    @Column(length = 60)
    private String marca;

    @Column(length = 60)
    private String modelo;

    private Integer anio;

    /** Último kilometraje conocido (se actualiza al vender con km). */
    private Integer km;

    @Column(nullable = false, updatable = false)
    private LocalDateTime creadoEn = LocalDateTime.now();
}
