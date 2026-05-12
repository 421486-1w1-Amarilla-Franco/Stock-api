-- ============================================================
-- Stock API - Script de creacion de base de datos
-- Ejecutar en SQL Server Management Studio como sa o admin
-- ============================================================

-- 1. Crear la base de datos
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'stock_db')
BEGIN
    CREATE DATABASE stock_db;
    PRINT 'Base de datos stock_db creada.';
END
ELSE
BEGIN
    PRINT 'La base de datos stock_db ya existe.';
END
GO

USE stock_db;
GO

-- ============================================================
-- Las tablas son creadas automaticamente por Hibernate al
-- iniciar la aplicacion (spring.jpa.hibernate.ddl-auto=update)
--
-- Si preferis crearlas manualmente, usa el bloque de abajo.
-- ============================================================

-- OPCIONAL: Crear tablas manualmente (descomentar si es necesario)

/*
CREATE TABLE usuarios (
    id            BIGINT IDENTITY(1,1) PRIMARY KEY,
    nombre        NVARCHAR(100)  NOT NULL,
    email         NVARCHAR(150)  NOT NULL UNIQUE,
    password_hash NVARCHAR(255)  NOT NULL,
    rol           NVARCHAR(20)   NOT NULL DEFAULT 'OPERADOR',
    activo        BIT            NOT NULL DEFAULT 1,
    creado_en     DATETIME2      DEFAULT GETDATE()
);

CREATE TABLE productos (
    id             BIGINT IDENTITY(1,1) PRIMARY KEY,
    nombre         NVARCHAR(150)  NOT NULL,
    codigo         NVARCHAR(50),
    categoria      NVARCHAR(20)   NOT NULL,
    descripcion    NVARCHAR(255),
    precio_costo   DECIMAL(10,2)  NOT NULL DEFAULT 0,
    precio_venta   DECIMAL(10,2)  NOT NULL DEFAULT 0,
    stock_actual   INT            NOT NULL DEFAULT 0,
    stock_minimo   INT            NOT NULL DEFAULT 0,
    activo         BIT            NOT NULL DEFAULT 1,
    creado_en      DATETIME2      DEFAULT GETDATE(),
    actualizado_en DATETIME2
);

CREATE TABLE movimientos (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    producto_id     BIGINT        NOT NULL REFERENCES productos(id),
    usuario_id      BIGINT        NOT NULL REFERENCES usuarios(id),
    tipo            NVARCHAR(20)  NOT NULL,
    cantidad        INT           NOT NULL,
    nota            NVARCHAR(255),
    stock_anterior  INT,
    stock_posterior INT,
    fecha           DATETIME2     DEFAULT GETDATE()
);

CREATE TABLE transacciones (
    id             BIGINT IDENTITY(1,1) PRIMARY KEY,
    usuario_id     BIGINT        NOT NULL REFERENCES usuarios(id),
    total          DECIMAL(10,2) NOT NULL DEFAULT 0,
    estado         NVARCHAR(20)  NOT NULL DEFAULT 'PENDIENTE',
    observaciones  NVARCHAR(255),
    fecha          DATETIME2     DEFAULT GETDATE()
);

CREATE TABLE detalle_ventas (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    transaccion_id  BIGINT        NOT NULL REFERENCES transacciones(id),
    producto_id     BIGINT        NOT NULL REFERENCES productos(id),
    cantidad        INT           NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal        DECIMAL(10,2) NOT NULL
);
*/

PRINT 'Script ejecutado correctamente. Inicia la aplicacion para que Hibernate genere las tablas.';
GO
