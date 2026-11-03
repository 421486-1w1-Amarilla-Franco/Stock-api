-- Integridad de stock y catálogo.

-- Bloqueo optimista: dos escrituras concurrentes sobre el mismo producto no se pisan.
ALTER TABLE productos ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

-- Red de seguridad en la base: el stock y los precios nunca quedan negativos.
ALTER TABLE productos ADD CONSTRAINT ck_productos_stock_actual  CHECK (stock_actual >= 0);
ALTER TABLE productos ADD CONSTRAINT ck_productos_stock_minimo  CHECK (stock_minimo >= 0);
ALTER TABLE productos ADD CONSTRAINT ck_productos_precios       CHECK (precio_costo >= 0 AND precio_venta >= 0);
ALTER TABLE detalle_ventas ADD CONSTRAINT ck_detalle_ventas_cantidad CHECK (cantidad > 0);

-- Código único (sin distinguir mayúsculas). Vacíos pasan a NULL para no chocar entre sí.
UPDATE productos SET codigo = NULL WHERE trim(codigo) = '';
UPDATE productos SET codigo = upper(trim(codigo)) WHERE codigo IS NOT NULL;
CREATE UNIQUE INDEX ux_productos_codigo ON productos (codigo) WHERE codigo IS NOT NULL;

-- Índices para listados paginados y reportes por fecha.
CREATE INDEX IF NOT EXISTS ix_movimientos_fecha       ON movimientos (fecha DESC);
CREATE INDEX IF NOT EXISTS ix_movimientos_producto    ON movimientos (producto_id, fecha DESC);
CREATE INDEX IF NOT EXISTS ix_transacciones_fecha     ON transacciones (fecha DESC);
CREATE INDEX IF NOT EXISTS ix_detalle_ventas_transacc ON detalle_ventas (transaccion_id);
CREATE INDEX IF NOT EXISTS ix_detalle_ventas_producto ON detalle_ventas (producto_id);
