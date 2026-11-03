-- ================================================================
--  Stock API · Datos de demo — Taller mecánico Av. Mitre 2340
--  Pegar completo en Supabase → SQL Editor → Run
--  IMPORTANTE: borra todos los datos actuales (excepto usuarios)
-- ================================================================

BEGIN;

-- ── 1. Limpiar tablas (preserva usuarios) ────────────────────────
TRUNCATE detalle_ventas RESTART IDENTITY CASCADE;
TRUNCATE movimientos    RESTART IDENTITY CASCADE;
TRUNCATE transacciones  RESTART IDENTITY CASCADE;
TRUNCATE productos      RESTART IDENTITY CASCADE;

-- ── 2. Usuario OPERADOR (hereda contraseña del admin) ────────────
-- Credenciales: operador@taller.com / misma contraseña que admin
INSERT INTO usuarios (nombre, email, password_hash, rol, activo, creado_en)
SELECT 'Marcos Pérez', 'operador@taller.com', password_hash, 'OPERADOR', true,
       NOW() - INTERVAL '45 days'
FROM   usuarios WHERE email = 'admin@stockapi.com'
ON CONFLICT (email) DO NOTHING;

-- ── 3. Productos (20) ─────────────────────────────────────────────
--   6 productos bajo stock mínimo para que el dashboard lo muestre
INSERT INTO productos
  (nombre, codigo, categoria, descripcion,
   precio_costo, precio_venta, stock_actual, stock_minimo, activo, creado_en)
VALUES
--  REPUESTOS ─────────────────────────────────────────────────────
('Filtro de aceite Mann W712/75',        'FLT-001','REPUESTO',  'Compatible: VW Gol, Saveiro, Suran 1.4-1.6',           1200.00,  2100.00, 12, 3, true, NOW()-INTERVAL '90 days'),
('Filtro de aire Fram CA10190',           'FLT-002','REPUESTO',  'Compatible: Renault Clio II / Megane I 1.6',             890.00,  1550.00,  8, 3, true, NOW()-INTERVAL '90 days'),
('Filtro de combustible Fram G8015',     'FLT-003','REPUESTO',  'Universal EFI y carburador',                             650.00,  1150.00, 15, 5, true, NOW()-INTERVAL '90 days'),
('Pastillas de freno Brembo P83020',     'PAS-001','REPUESTO',  'Eje delantero — Peugeot 206/207/307',                  3200.00,  5800.00,  6, 2, true, NOW()-INTERVAL '90 days'),
('Disco de freno Brembo 09A36411',       'DIS-001','REPUESTO',  'Ventilado Ø256mm — Ford Fiesta / EcoSport',            4500.00,  7900.00,  4, 2, true, NOW()-INTERVAL '90 days'),
('Amortiguador Monroe E6103',            'AMO-001','REPUESTO',  'Gas delantero — Chevrolet Corsa / Agile',              5800.00,  9500.00,  1, 2, true, NOW()-INTERVAL '90 days'), -- BAJO STOCK
('Bujías NGK BPR6ES (juego x4)',         'BUJ-001','REPUESTO',  'Encendido estándar — universal',                       1800.00,  3200.00, 10, 4, true, NOW()-INTERVAL '90 days'),
('Correa de distribución Gates T168',    'COR-001','REPUESTO',  'Renault K7M / K7J 1.6 16v',                            2200.00,  3800.00,  5, 2, true, NOW()-INTERVAL '90 days'),
('Bomba de agua Dolz A148',              'BOM-001','REPUESTO',  'Peugeot / Citroën TU5JP4 1.6',                         3600.00,  6200.00,  0, 1, true, NOW()-INTERVAL '90 days'), -- SIN STOCK
('Tensor de distribución SKF VKM11274',  'TEN-001','REPUESTO',  'Compatible serie Gates T168',                          1900.00,  3300.00,  4, 2, true, NOW()-INTERVAL '90 days'),
('Termostato Wahler 3162.87D',           'TER-001','REPUESTO',  'Apertura 87°C — VW 1.4 / 1.6 8v',                      980.00,  1700.00,  7, 3, true, NOW()-INTERVAL '90 days'),
('Bobina de encendido Bosch 0221503',    'BOB-001','REPUESTO',  'Ignición Toyota / Lexus 1ZZ-FE',                       4200.00,  7200.00,  1, 2, true, NOW()-INTERVAL '90 days'), -- BAJO STOCK
('Sensor O2 Bosch 0258005133',           'SEN-001','REPUESTO',  '4 cables — Upstream pre-catalizador',                  6500.00, 11000.00,  1, 2, true, NOW()-INTERVAL '90 days'), -- BAJO STOCK
('Junta de culata Reinz 61-37195-00',    'JUN-001','REPUESTO',  'VW AGN / AZH 2.0 8v',                                  2800.00,  4800.00,  3, 2, true, NOW()-INTERVAL '90 days'),
--  LUBRICANTES ────────────────────────────────────────────────────
('Aceite Mobil 1 5W30 1L',               'ACE-001','LUBRICANTE','Sintético total — API SN/CF',                          1800.00,  3100.00, 24,10, true, NOW()-INTERVAL '90 days'),
('Aceite Mobil Super 10W40 4L',          'ACE-002','LUBRICANTE','Semisintético — API SM/CF',                            5200.00,  8900.00, 18, 8, true, NOW()-INTERVAL '90 days'),
('Aceite Castrol GTX 20W50 1L',          'ACE-003','LUBRICANTE','Mineral — API SN — motores con desgaste',              1400.00,  2400.00, 20, 8, true, NOW()-INTERVAL '90 days'),
('Líquido de frenos DOT4 500ml',         'LIQ-001','LUBRICANTE','Punto ebullición 230°C',                                680.00,  1200.00, 15, 5, true, NOW()-INTERVAL '90 days'),
('Refrigerante OAT Concentrado 1L',      'REF-001','LUBRICANTE','Orgánico — mezclar 1:1 con agua destilada',             890.00,  1550.00,  0, 5, true, NOW()-INTERVAL '90 days'), -- SIN STOCK
('Grasa de bolas Bardahl EP2 180g',      'GRA-001','LUBRICANTE','Triples a base de litio',                               420.00,   750.00,  2, 3, true, NOW()-INTERVAL '90 days'); -- BAJO STOCK

-- ── 4. Transacciones — 28 ventas en 30 días ──────────────────────
--  usuario_id 1 = admin@stockapi.com (ADMIN)
--  usuario_id 2 = operador@taller.com (OPERADOR)
INSERT INTO transacciones (usuario_id, total, estado, observaciones, fecha) VALUES
(1, 10400.00,'COMPLETADA','Cambio de aceite — VW Gol G5',                NOW()-INTERVAL '28 days'+TIME '09:15:00'),
(1,  8200.00,'COMPLETADA','Frenos delanteros — Peugeot 206',             NOW()-INTERVAL '27 days'+TIME '11:00:00'),
(1, 13300.00,'COMPLETADA','Distribución completa — Renault Clio 1.6',   NOW()-INTERVAL '25 days'+TIME '10:30:00'),
(2, 13250.00,'COMPLETADA','Service 10.000km — Renault Logan',           NOW()-INTERVAL '24 days'+TIME '09:00:00'),
(1, 10800.00,'COMPLETADA','Aceite y accesorios — Chevrolet Spin',       NOW()-INTERVAL '22 days'+TIME '14:00:00'),
(1, 27400.00,'COMPLETADA','Sistema de frenado completo — Ford Focus',   NOW()-INTERVAL '21 days'+TIME '10:00:00'),
(2, 17700.00,'COMPLETADA','Service completo — VW Vento',                NOW()-INTERVAL '19 days'+TIME '09:30:00'),
(1, 12700.00,'COMPLETADA','Diagnóstico y sensor O2 — Toyota Corolla',  NOW()-INTERVAL '18 days'+TIME '15:00:00'),
(2, 14900.00,'COMPLETADA','Frenos traseros — Fiat Palio',               NOW()-INTERVAL '16 days'+TIME '11:30:00'),
(1, 12950.00,'COMPLETADA','Cambio de aceite — Peugeot 307',             NOW()-INTERVAL '15 days'+TIME '09:00:00'),
(1, 18400.00,'COMPLETADA','Distribución + refrigeración — Citroën C3', NOW()-INTERVAL '14 days'+TIME '10:00:00'),
(2, 14200.00,'COMPLETADA','Service — Chevrolet Spark',                  NOW()-INTERVAL '12 days'+TIME '14:30:00'),
(1,  6600.00,'COMPLETADA','Repuestos stock taller',                     NOW()-INTERVAL '11 days'+TIME '08:00:00'),
(1,  6350.00,'COMPLETADA','Sistema de refrigeración — Renault Sandero', NOW()-INTERVAL '10 days'+TIME '10:00:00'),
(1, 29100.00,'COMPLETADA','Frenos completos + aceite — Ford Ranger',    NOW()-INTERVAL  '9 days'+TIME '09:30:00'),
(2, 11950.00,'COMPLETADA','Sistema de encendido — Toyota Etios',        NOW()-INTERVAL  '8 days'+TIME '11:00:00'),
(1, 12150.00,'COMPLETADA','Service — Fiat 500',                         NOW()-INTERVAL  '7 days'+TIME '10:30:00'),
(2, 12800.00,'COMPLETADA','Frenos delanteros — Honda Fit',              NOW()-INTERVAL  '6 days'+TIME '14:00:00'),
(1, 18900.00,'COMPLETADA','Junta de culata + aceite — VW Gol',          NOW()-INTERVAL  '5 days'+TIME '09:00:00'),
(1, 19250.00,'COMPLETADA','Service completo — Renault Clio II',         NOW()-INTERVAL  '4 days'+TIME '10:00:00'),
(2, 21100.00,'COMPLETADA','Suspensión + frenos — Chevrolet Cruze',      NOW()-INTERVAL  '3 days'+TIME '11:30:00'),
(1, 12850.00,'COMPLETADA','Service aceite — Honda City',                NOW()-INTERVAL  '2 days'+TIME '10:00:00'),
(1, 21700.00,'COMPLETADA','Frenos completos — Peugeot 408',             NOW()-INTERVAL  '1 day' +TIME '15:00:00'),
(2, 12550.00,'COMPLETADA','Service — Ford EcoSport',                    NOW()                   +TIME '10:00:00'),
(2,  8500.00,'COMPLETADA','Filtros y aceite — Renault Fluence',         NOW()-INTERVAL '26 days'+TIME '09:00:00'),
(1, 10300.00,'COMPLETADA','Discos de freno — Citroën Berlingo',         NOW()-INTERVAL '23 days'+TIME '13:00:00'),
(2, 12550.00,'COMPLETADA','Aceite + filtros — Chevrolet Onix',          NOW()-INTERVAL '20 days'+TIME '09:30:00'),
(1,  7100.00,'COMPLETADA','Distribución — VW Suran',                    NOW()-INTERVAL '13 days'+TIME '11:00:00');

-- ── 5. Detalle ventas ─────────────────────────────────────────────
--  IDs de productos:  1=FLT-001  2=FLT-002  3=FLT-003  4=PAS-001  5=DIS-001
--                     6=AMO-001  7=BUJ-001  8=COR-001  9=BOM-001  10=TEN-001
--                     11=TER-001 12=BOB-001 13=SEN-001 14=JUN-001 15=ACE-001
--                     16=ACE-002 17=ACE-003 18=LIQ-001 19=REF-001 20=GRA-001
INSERT INTO detalle_ventas (transaccion_id, producto_id, cantidad, precio_unitario, subtotal) VALUES
-- V1: VW Gol — cambio aceite
(1,  1, 2, 2100.00,  4200.00),
(1, 15, 2, 3100.00,  6200.00),
-- V2: Peugeot 206 — frenos
(2,  4, 1, 5800.00,  5800.00),
(2, 18, 2, 1200.00,  2400.00),
-- V3: Renault Clio — distribución completa
(3,  8, 1, 3800.00,  3800.00),
(3, 10, 1, 3300.00,  3300.00),
(3,  9, 1, 6200.00,  6200.00),
-- V4: Renault Logan — service 10k
(4,  1, 1, 2100.00,  2100.00),
(4,  2, 1, 1550.00,  1550.00),
(4, 17, 4, 2400.00,  9600.00),
-- V5: Chevrolet Spin — aceite
(5, 16, 1, 8900.00,  8900.00),
(5,  3, 1, 1150.00,  1150.00),
(5, 20, 1,  750.00,   750.00),
-- V6: Ford Focus — frenos completos
(6,  4, 2, 5800.00, 11600.00),
(6,  5, 2, 7900.00, 15800.00),
-- V7: VW Vento — service completo
(7,  1, 1, 2100.00,  2100.00),
(7,  7, 1, 3200.00,  3200.00),
(7, 15, 4, 3100.00, 12400.00),
-- V8: Toyota Corolla — sensor O2
(8, 13, 1,11000.00, 11000.00),
(8, 11, 1, 1700.00,  1700.00),
-- V9: Fiat Palio — frenos traseros
(9,  4, 1, 5800.00,  5800.00),
(9,  5, 1, 7900.00,  7900.00),
(9, 18, 1, 1200.00,  1200.00),
-- V10: Peugeot 307 — aceite
(10,  1, 1, 2100.00,  2100.00),
(10, 15, 3, 3100.00,  9300.00),
(10,  2, 1, 1550.00,  1550.00),
-- V11: Citroën C3 — distribución + refrigeración
(11,  8, 1, 3800.00,  3800.00),
(11, 10, 1, 3300.00,  3300.00),
(11, 11, 1, 1700.00,  1700.00),
(11, 17, 4, 2400.00,  9600.00),
-- V12: Chevrolet Spark — service
(12,  7, 1, 3200.00,  3200.00),
(12,  1, 1, 2100.00,  2100.00),
(12, 16, 1, 8900.00,  8900.00),
-- V13: stock taller
(13,  3, 3, 1150.00,  3450.00),
(13, 20, 1,  750.00,   750.00),
(13, 18, 2, 1200.00,  2400.00),
-- V14: Renault Sandero — refrigeración
(14, 19, 3, 1550.00,  4650.00),
(14, 11, 1, 1700.00,  1700.00),
-- V15: Ford Ranger — frenos + aceite
(15,  4, 2, 5800.00, 11600.00),
(15,  5, 1, 7900.00,  7900.00),
(15, 17, 4, 2400.00,  9600.00),
-- V16: Toyota Etios — encendido
(16, 12, 1, 7200.00,  7200.00),
(16,  7, 1, 3200.00,  3200.00),
(16,  2, 1, 1550.00,  1550.00),
-- V17: Fiat 500 — service
(17, 16, 1, 8900.00,  8900.00),
(17,  1, 1, 2100.00,  2100.00),
(17,  3, 1, 1150.00,  1150.00),
-- V18: Honda Fit — frenos
(18,  4, 2, 5800.00, 11600.00),
(18, 18, 1, 1200.00,  1200.00),
-- V19: VW Gol — junta culata + aceite
(19, 14, 1, 4800.00,  4800.00),
(19, 15, 4, 3100.00, 12400.00),
(19, 11, 1, 1700.00,  1700.00),
-- V20: Renault Clio — service completo
(20,  1, 1, 2100.00,  2100.00),
(20,  2, 1, 1550.00,  1550.00),
(20,  7, 1, 3200.00,  3200.00),
(20, 15, 4, 3100.00, 12400.00),
-- V21: Chevrolet Cruze — suspensión + frenos
(21,  6, 1, 9500.00,  9500.00),
(21,  4, 2, 5800.00, 11600.00),
-- V22: Honda City — aceite
(22,  1, 1, 2100.00,  2100.00),
(22, 17, 4, 2400.00,  9600.00),
(22,  3, 1, 1150.00,  1150.00),
-- V23: Peugeot 408 — frenos completos
(23,  4, 2, 5800.00, 11600.00),
(23, 16, 1, 8900.00,  8900.00),
(23, 18, 1, 1200.00,  1200.00),
-- V24: Ford EcoSport — service (hoy)
(24,  1, 1, 2100.00,  2100.00),
(24, 16, 1, 8900.00,  8900.00),
(24,  2, 1, 1550.00,  1550.00),
-- V25: Renault Fluence — filtros + aceite
(25,  3, 2, 1150.00,  2300.00),
(25, 15, 2, 3100.00,  6200.00),
-- V26: Citroën Berlingo — discos
(26,  5, 1, 7900.00,  7900.00),
(26, 18, 2, 1200.00,  2400.00),
-- V27: Chevrolet Onix — aceite + filtros
(27,  1, 1, 2100.00,  2100.00),
(27,  2, 1, 1550.00,  1550.00),
(27, 16, 1, 8900.00,  8900.00),
-- V28: VW Suran — distribución
(28, 10, 1, 3300.00,  3300.00),
(28,  8, 1, 3800.00,  3800.00);

-- ── 6. Movimientos (historial + reposiciones + ajustes) ──────────
--  Últimos 28 días: SALIDA (ventas), ENTRADA (reposiciones), AJUSTE
INSERT INTO movimientos (producto_id, usuario_id, tipo, cantidad, stock_anterior, stock_posterior, nota, fecha) VALUES

-- ── Reposiciones de stock (ENTRADA) ──────────────────────────────
(15, 1,'ENTRADA',40, 8, 48,'Reposición — compra proveedor MobilOil',  NOW()-INTERVAL '27 days'+TIME '08:00:00'),
( 1, 1,'ENTRADA',20, 5, 25,'Reposición — compra proveedor Filtros SA',NOW()-INTERVAL '20 days'+TIME '08:00:00'),
( 4, 1,'ENTRADA',12, 2, 14,'Reposición — compra proveedor Frenos Arg',NOW()-INTERVAL '14 days'+TIME '08:30:00'),
(17, 1,'ENTRADA',20, 8, 28,'Reposición — compra proveedor Castrol',   NOW()-INTERVAL '10 days'+TIME '08:00:00'),
(16, 1,'ENTRADA', 8,12, 20,'Reposición — compra proveedor MobilOil',  NOW()-INTERVAL  '2 days'+TIME '08:00:00'),
(18, 1,'ENTRADA',10, 7, 17,'Reposición — compra proveedor LubriTec',  NOW()-INTERVAL '16 days'+TIME '08:30:00'),

-- ── Ajustes de inventario (AJUSTE) ───────────────────────────────
( 3, 1,'AJUSTE',  3, 12, 15,'Corrección conteo físico — diferencia positiva', NOW()-INTERVAL '18 days'+TIME '17:00:00'),
(19, 1,'AJUSTE', -3,  3,  0,'Producto vencido retirado de stock',              NOW()-INTERVAL  '9 days'+TIME '16:00:00'),
(20, 1,'AJUSTE', -1,  3,  2,'Daño en depósito — unidad irrecuperable',         NOW()-INTERVAL  '7 days'+TIME '16:30:00'),

-- ── SALIDA por ventas (las más recientes van primero en el dashboard) ─
-- Hoy — V24 Ford EcoSport
( 2, 2,'SALIDA', 1, 9,  8,'Venta #24', NOW()                   +TIME '10:30:00'),
(16, 2,'SALIDA', 1,19, 18,'Venta #24', NOW()                   +TIME '10:15:00'),
( 1, 2,'SALIDA', 1,13, 12,'Venta #24', NOW()                   +TIME '10:00:00'),
-- Ayer — V23 Peugeot 408
(18, 1,'SALIDA', 1,16, 15,'Venta #23', NOW()-INTERVAL '1 day'  +TIME '15:30:00'),
(16, 1,'SALIDA', 1,20, 19,'Venta #23', NOW()-INTERVAL '1 day'  +TIME '15:15:00'),
( 4, 1,'SALIDA', 2, 8,  6,'Venta #23', NOW()-INTERVAL '1 day'  +TIME '15:00:00'),
-- Hace 2 días — V22 Honda City
( 3, 1,'SALIDA', 1,16, 15,'Venta #22', NOW()-INTERVAL '2 days' +TIME '10:30:00'),
(17, 1,'SALIDA', 4,24, 20,'Venta #22', NOW()-INTERVAL '2 days' +TIME '10:15:00'),
( 1, 1,'SALIDA', 1,14, 13,'Venta #22', NOW()-INTERVAL '2 days' +TIME '10:00:00'),
-- Hace 3 días — V21 Chevrolet Cruze
( 4, 2,'SALIDA', 2,10,  8,'Venta #21', NOW()-INTERVAL '3 days' +TIME '11:45:00'),
( 6, 2,'SALIDA', 1, 2,  1,'Venta #21', NOW()-INTERVAL '3 days' +TIME '11:30:00'),
-- Hace 4 días — V20 Renault Clio
(15, 1,'SALIDA', 4,32, 28,'Venta #20', NOW()-INTERVAL '4 days' +TIME '10:30:00'),
( 7, 1,'SALIDA', 1,11, 10,'Venta #20', NOW()-INTERVAL '4 days' +TIME '10:15:00'),
( 2, 1,'SALIDA', 1,10,  9,'Venta #20', NOW()-INTERVAL '4 days' +TIME '10:00:00'),
( 1, 1,'SALIDA', 1,15, 14,'Venta #20', NOW()-INTERVAL '4 days' +TIME '09:45:00'),
-- Hace 5 días — V19 VW Gol
(11, 1,'SALIDA', 1,11, 10,'Venta #19', NOW()-INTERVAL '5 days' +TIME '09:45:00'),
(15, 1,'SALIDA', 4,36, 32,'Venta #19', NOW()-INTERVAL '5 days' +TIME '09:30:00'),
(14, 1,'SALIDA', 1, 4,  3,'Venta #19', NOW()-INTERVAL '5 days' +TIME '09:00:00'),
-- Hace 6 días — V18 Honda Fit
(18, 2,'SALIDA', 1,17, 16,'Venta #18', NOW()-INTERVAL '6 days' +TIME '14:15:00'),
( 4, 2,'SALIDA', 2,12, 10,'Venta #18', NOW()-INTERVAL '6 days' +TIME '14:00:00'),
-- Hace 7 días — V17 Fiat 500
( 3, 1,'SALIDA', 1,17, 16,'Venta #17', NOW()-INTERVAL '7 days' +TIME '10:45:00'),
( 1, 1,'SALIDA', 1,16, 15,'Venta #17', NOW()-INTERVAL '7 days' +TIME '10:30:00'),
(16, 1,'SALIDA', 1,21, 20,'Venta #17', NOW()-INTERVAL '7 days' +TIME '10:00:00'),
-- Hace 8 días — V16 Toyota Etios
( 2, 2,'SALIDA', 1,11, 10,'Venta #16', NOW()-INTERVAL '8 days' +TIME '11:15:00'),
( 7, 2,'SALIDA', 1,12, 11,'Venta #16', NOW()-INTERVAL '8 days' +TIME '11:00:00'),
(12, 2,'SALIDA', 1, 2,  1,'Venta #16', NOW()-INTERVAL '8 days' +TIME '10:30:00'),
-- Hace 9 días — V15 Ford Ranger
(17, 1,'SALIDA', 4,32, 28,'Venta #15', NOW()-INTERVAL '9 days' +TIME '09:45:00'),
( 5, 1,'SALIDA', 1, 6,  5,'Venta #15', NOW()-INTERVAL '9 days' +TIME '09:30:00'),
( 4, 1,'SALIDA', 2,14, 12,'Venta #15', NOW()-INTERVAL '9 days' +TIME '09:00:00'),
-- Hace 12 días — V12 Chevrolet Spark
(16, 2,'SALIDA', 1,22, 21,'Venta #12', NOW()-INTERVAL '12 days'+TIME '14:45:00'),
( 1, 2,'SALIDA', 1,18, 17,'Venta #12', NOW()-INTERVAL '12 days'+TIME '14:30:00'),
( 7, 2,'SALIDA', 1,13, 12,'Venta #12', NOW()-INTERVAL '12 days'+TIME '14:00:00'),
-- Hace 14 días — V11 Citroën C3
(17, 1,'SALIDA', 4,36, 32,'Venta #11', NOW()-INTERVAL '14 days'+TIME '10:30:00'),
(11, 1,'SALIDA', 1,12, 11,'Venta #11', NOW()-INTERVAL '14 days'+TIME '10:15:00'),
(10, 1,'SALIDA', 1, 6,  5,'Venta #11', NOW()-INTERVAL '14 days'+TIME '10:00:00'),
( 8, 1,'SALIDA', 1, 7,  6,'Venta #11', NOW()-INTERVAL '14 days'+TIME '09:30:00');

COMMIT;

-- ================================================================
--  Verificación rápida (opcional — ejecutar por separado):
-- ================================================================
-- SELECT COUNT(*) AS productos  FROM productos;      -- 20
-- SELECT COUNT(*) AS ventas     FROM transacciones;  -- 28
-- SELECT COUNT(*) AS detalle    FROM detalle_ventas; -- 70
-- SELECT COUNT(*) AS movimientos FROM movimientos;   -- 45
-- SELECT nombre, stock_actual, stock_minimo
--   FROM productos
--   WHERE stock_actual <= stock_minimo
--   ORDER BY stock_actual::float / NULLIF(stock_minimo,0);
