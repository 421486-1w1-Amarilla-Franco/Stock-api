-- Esquema que Hibernate (ddl-auto=update) creaba antes de Flyway.
-- Idempotente: en bases existentes no hace nada; en bases nuevas crea todo.

CREATE TABLE IF NOT EXISTS usuarios (
    id            BIGSERIAL PRIMARY KEY,
    nombre        VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol           VARCHAR(255) NOT NULL CHECK (rol IN ('ADMIN', 'OPERADOR')),
    activo        BOOLEAN      NOT NULL,
    creado_en     TIMESTAMP(6)
);

CREATE TABLE IF NOT EXISTS productos (
    id             BIGSERIAL PRIMARY KEY,
    nombre         VARCHAR(150)   NOT NULL,
    codigo         VARCHAR(50),
    categoria      VARCHAR(255)   NOT NULL CHECK (categoria IN ('REPUESTO', 'LUBRICANTE')),
    descripcion    VARCHAR(255),
    precio_costo   NUMERIC(10, 2) NOT NULL,
    precio_venta   NUMERIC(10, 2) NOT NULL,
    stock_actual   INTEGER        NOT NULL,
    stock_minimo   INTEGER        NOT NULL,
    activo         BOOLEAN        NOT NULL,
    creado_en      TIMESTAMP(6),
    actualizado_en TIMESTAMP(6)
);

CREATE TABLE IF NOT EXISTS movimientos (
    id              BIGSERIAL PRIMARY KEY,
    producto_id     BIGINT       NOT NULL REFERENCES productos (id),
    usuario_id      BIGINT       NOT NULL REFERENCES usuarios (id),
    tipo            VARCHAR(255) NOT NULL CHECK (tipo IN ('ENTRADA', 'SALIDA', 'AJUSTE')),
    cantidad        INTEGER      NOT NULL,
    nota            VARCHAR(255),
    stock_anterior  INTEGER,
    stock_posterior INTEGER,
    fecha           TIMESTAMP(6) NOT NULL
);

CREATE TABLE IF NOT EXISTS transacciones (
    id            BIGSERIAL PRIMARY KEY,
    usuario_id    BIGINT         NOT NULL REFERENCES usuarios (id),
    total         NUMERIC(10, 2) NOT NULL,
    estado        VARCHAR(255)   NOT NULL CHECK (estado IN ('PENDIENTE', 'COMPLETADA', 'ANULADA')),
    observaciones VARCHAR(255),
    fecha         TIMESTAMP(6)   NOT NULL
);

CREATE TABLE IF NOT EXISTS detalle_ventas (
    id              BIGSERIAL PRIMARY KEY,
    transaccion_id  BIGINT         NOT NULL REFERENCES transacciones (id),
    producto_id     BIGINT         NOT NULL REFERENCES productos (id),
    cantidad        INTEGER        NOT NULL,
    precio_unitario NUMERIC(10, 2) NOT NULL,
    subtotal        NUMERIC(10, 2) NOT NULL
);
