-- ============================================================
-- Stock API - Script de creacion de base de datos
-- Ejecutar en Supabase SQL Editor o psql
-- ============================================================

-- Las tablas son creadas automaticamente por Hibernate al
-- iniciar la aplicacion (spring.jpa.hibernate.ddl-auto=update)
--
-- Si preferis crearlas manualmente, usa el bloque de abajo.
-- ============================================================

-- OPCIONAL: Crear tablas manualmente (descomentar si es necesario)

/*
CREATE TABLE IF NOT EXISTS usuarios (
    id            BIGSERIAL PRIMARY KEY,
    nombre        VARCHAR(100)  NOT NULL,
    email         VARCHAR(150)  NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    rol           VARCHAR(20)   NOT NULL DEFAULT 'OPERADOR',
    activo        BOOLEAN       NOT NULL DEFAULT TRUE,
    creado_en     TIMESTAMP     DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS productos (
    id             BIGSERIAL PRIMARY KEY,
    nombre         VARCHAR(150)  NOT NULL,
    codigo         VARCHAR(50),
    categoria      VARCHAR(20)   NOT NULL,
    descripcion    VARCHAR(255),
    precio_costo   DECIMAL(10,2) NOT NULL DEFAULT 0,
    precio_venta   DECIMAL(10,2) NOT NULL DEFAULT 0,
    stock_actual   INT           NOT NULL DEFAULT 0,
    stock_minimo   INT           NOT NULL DEFAULT 0,
    activo         BOOLEAN       NOT NULL DEFAULT TRUE,
    creado_en      TIMESTAMP     DEFAULT NOW(),
    actualizado_en TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movimientos (
    id              BIGSERIAL PRIMARY KEY,
    producto_id     BIGINT        NOT NULL REFERENCES productos(id),
    usuario_id      BIGINT        NOT NULL REFERENCES usuarios(id),
    tipo            VARCHAR(20)   NOT NULL,
    cantidad        INT           NOT NULL,
    nota            VARCHAR(255),
    stock_anterior  INT,
    stock_posterior INT,
    fecha           TIMESTAMP     DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transacciones (
    id             BIGSERIAL PRIMARY KEY,
    usuario_id     BIGINT        NOT NULL REFERENCES usuarios(id),
    total          DECIMAL(10,2) NOT NULL DEFAULT 0,
    estado         VARCHAR(20)   NOT NULL DEFAULT 'PENDIENTE',
    observaciones  VARCHAR(255),
    fecha          TIMESTAMP     DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS detalle_ventas (
    id              BIGSERIAL PRIMARY KEY,
    transaccion_id  BIGINT        NOT NULL REFERENCES transacciones(id),
    producto_id     BIGINT        NOT NULL REFERENCES productos(id),
    cantidad        INT           NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal        DECIMAL(10,2) NOT NULL
);
*/
