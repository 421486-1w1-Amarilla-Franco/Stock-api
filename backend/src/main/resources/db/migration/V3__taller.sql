-- Funciones de taller: clientes y vehículos, medio de pago, mano de obra,
-- costo histórico por línea, proveedores, compras y cierre de caja.

CREATE TABLE clientes (
    id         BIGSERIAL PRIMARY KEY,
    nombre     VARCHAR(120) NOT NULL,
    telefono   VARCHAR(40),
    email      VARCHAR(150),
    documento  VARCHAR(20),
    notas      VARCHAR(255),
    activo     BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en  TIMESTAMP(6) NOT NULL DEFAULT now()
);

CREATE TABLE vehiculos (
    id          BIGSERIAL PRIMARY KEY,
    cliente_id  BIGINT       NOT NULL REFERENCES clientes (id),
    patente     VARCHAR(10)  NOT NULL,
    marca       VARCHAR(60),
    modelo      VARCHAR(60),
    anio        INTEGER CHECK (anio IS NULL OR anio BETWEEN 1900 AND 2100),
    km          INTEGER CHECK (km IS NULL OR km >= 0),
    creado_en   TIMESTAMP(6) NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ux_vehiculos_patente ON vehiculos (patente);
CREATE INDEX ix_vehiculos_cliente ON vehiculos (cliente_id);

ALTER TABLE transacciones
    ADD COLUMN medio_pago  VARCHAR(20)    NOT NULL DEFAULT 'EFECTIVO'
        CHECK (medio_pago IN ('EFECTIVO', 'DEBITO', 'CREDITO', 'TRANSFERENCIA')),
    ADD COLUMN mano_obra   NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (mano_obra >= 0),
    ADD COLUMN cliente_id  BIGINT REFERENCES clientes (id),
    ADD COLUMN vehiculo_id BIGINT REFERENCES vehiculos (id),
    ADD COLUMN km_vehiculo INTEGER CHECK (km_vehiculo IS NULL OR km_vehiculo >= 0);
CREATE INDEX ix_transacciones_vehiculo ON transacciones (vehiculo_id);
CREATE INDEX ix_transacciones_cliente  ON transacciones (cliente_id);

-- Costo al momento de vender: el margen histórico no cambia si después sube el costo.
ALTER TABLE detalle_ventas ADD COLUMN costo_unitario NUMERIC(10, 2) NOT NULL DEFAULT 0;
UPDATE detalle_ventas d SET costo_unitario = p.precio_costo FROM productos p WHERE p.id = d.producto_id;

CREATE TABLE proveedores (
    id        BIGSERIAL PRIMARY KEY,
    nombre    VARCHAR(120) NOT NULL,
    cuit      VARCHAR(13),
    telefono  VARCHAR(40),
    email     VARCHAR(150),
    activo    BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP(6) NOT NULL DEFAULT now()
);

CREATE TABLE compras (
    id             BIGSERIAL PRIMARY KEY,
    proveedor_id   BIGINT         NOT NULL REFERENCES proveedores (id),
    usuario_id     BIGINT         NOT NULL REFERENCES usuarios (id),
    estado         VARCHAR(20)    NOT NULL CHECK (estado IN ('PENDIENTE', 'RECIBIDA', 'ANULADA')),
    comprobante    VARCHAR(40),
    observaciones  VARCHAR(255),
    total          NUMERIC(12, 2) NOT NULL DEFAULT 0,
    fecha          TIMESTAMP(6)   NOT NULL DEFAULT now(),
    recibida_en    TIMESTAMP(6)
);
CREATE INDEX ix_compras_fecha ON compras (fecha DESC);

CREATE TABLE detalle_compras (
    id             BIGSERIAL PRIMARY KEY,
    compra_id      BIGINT         NOT NULL REFERENCES compras (id) ON DELETE CASCADE,
    producto_id    BIGINT         NOT NULL REFERENCES productos (id),
    cantidad       INTEGER        NOT NULL CHECK (cantidad > 0),
    costo_unitario NUMERIC(10, 2) NOT NULL CHECK (costo_unitario >= 0)
);
CREATE INDEX ix_detalle_compras_compra ON detalle_compras (compra_id);

CREATE TABLE cierres_caja (
    id                BIGSERIAL PRIMARY KEY,
    fecha             DATE           NOT NULL UNIQUE,
    usuario_id        BIGINT         NOT NULL REFERENCES usuarios (id),
    cantidad_ventas   INTEGER        NOT NULL,
    total_efectivo      NUMERIC(12, 2) NOT NULL,
    total_debito        NUMERIC(12, 2) NOT NULL,
    total_credito       NUMERIC(12, 2) NOT NULL,
    total_transferencia NUMERIC(12, 2) NOT NULL,
    efectivo_contado  NUMERIC(12, 2) NOT NULL,
    diferencia        NUMERIC(12, 2) NOT NULL,
    observaciones     VARCHAR(255),
    creado_en         TIMESTAMP(6)   NOT NULL DEFAULT now()
);
