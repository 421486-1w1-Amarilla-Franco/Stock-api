# Stock API — Control de Repuestos y Lubricantes

## Instrucciones para Claude Code

Sos un agente de desarrollo. Tu tarea es construir una API REST completa siguiendo este documento de principio a fin, etapa por etapa, sin saltear pasos.

---

## Contexto del proyecto

API para gestionar stock de repuestos y lubricantes de un taller mecánico o similar. Permite registrar productos, controlar movimientos de stock, registrar ventas y generar reportes por período.

---

## Stack tecnológico

- **Lenguaje:** Java 21
- **Framework:** Spring Boot 3.2
- **Base de datos:** PostgreSQL
- **ORM:** Spring Data JPA / Hibernate
- **Autenticación:** Spring Security + JWT
- **Documentación:** Swagger / OpenAPI (springdoc)
- **Build tool:** Maven
- **Utilidades:** Lombok

---

## Estructura de directorios esperada

```
src/
└── main/
    ├── java/com/stockapi/
    │   ├── StockApiApplication.java
    │   ├── config/
    │   │   └── SwaggerConfig.java
    │   ├── controller/
    │   │   ├── AuthController.java
    │   │   ├── ProductoController.java
    │   │   ├── MovimientoController.java
    │   │   ├── VentaController.java
    │   │   └── ReporteController.java
    │   ├── service/
    │   │   ├── AuthService.java
    │   │   ├── ProductoService.java
    │   │   ├── MovimientoService.java
    │   │   ├── VentaService.java
    │   │   └── ReporteService.java
    │   ├── repository/
    │   │   ├── UsuarioRepository.java
    │   │   ├── ProductoRepository.java
    │   │   ├── MovimientoRepository.java
    │   │   └── TransaccionRepository.java
    │   ├── model/
    │   │   ├── Usuario.java
    │   │   ├── Producto.java
    │   │   ├── Movimiento.java
    │   │   ├── Transaccion.java
    │   │   └── DetalleVenta.java
    │   ├── dto/
    │   │   ├── auth/
    │   │   │   ├── LoginRequest.java
    │   │   │   └── LoginResponse.java
    │   │   ├── producto/
    │   │   │   ├── ProductoRequest.java
    │   │   │   └── ProductoResponse.java
    │   │   ├── movimiento/
    │   │   │   ├── MovimientoRequest.java
    │   │   │   └── MovimientoResponse.java
    │   │   ├── venta/
    │   │   │   ├── VentaRequest.java
    │   │   │   ├── DetalleVentaRequest.java
    │   │   │   └── VentaResponse.java
    │   │   └── reporte/
    │   │       ├── ReporteVentasResponse.java
    │   │       └── ProductoMasVendidoResponse.java
    │   ├── security/
    │   │   ├── JwtUtil.java
    │   │   ├── JwtAuthFilter.java
    │   │   ├── SecurityConfig.java
    │   │   └── UserDetailsServiceImpl.java
    │   └── exception/
    │       ├── GlobalExceptionHandler.java
    │       ├── ResourceNotFoundException.java
    │       └── StockInsuficienteException.java
    └── resources/
        └── application.properties
```

---

## Modelo de base de datos

### Entidad: Usuario
```
id             BIGINT PK AUTO_INCREMENT
nombre         VARCHAR(100) NOT NULL
email          VARCHAR(150) NOT NULL UNIQUE
passwordHash   VARCHAR(255) NOT NULL
rol            ENUM('ADMIN', 'OPERADOR') DEFAULT 'OPERADOR'
activo         BIT DEFAULT 1
creadoEn       DATETIME DEFAULT NOW()
```

### Entidad: Producto
```
id             BIGINT PK AUTO_INCREMENT
nombre         VARCHAR(150) NOT NULL
codigo         VARCHAR(50) UNIQUE
categoria      ENUM('REPUESTO', 'LUBRICANTE') NOT NULL
descripcion    VARCHAR(255)
precioCosto    DECIMAL(10,2) DEFAULT 0
precioVenta    DECIMAL(10,2) DEFAULT 0
stockActual    INT DEFAULT 0
stockMinimo    INT DEFAULT 0
activo         BIT DEFAULT 1
creadoEn       DATETIME DEFAULT NOW()
actualizadoEn  DATETIME
```

### Entidad: Movimiento
```
id             BIGINT PK AUTO_INCREMENT
producto_id    BIGINT FK → Producto
usuario_id     BIGINT FK → Usuario
tipo           ENUM('ENTRADA', 'SALIDA', 'AJUSTE') NOT NULL
cantidad       INT NOT NULL
nota           VARCHAR(255)
stockAnterior  INT
stockPosterior INT
fecha          DATETIME DEFAULT NOW()
```

### Entidad: Transaccion
```
id             BIGINT PK AUTO_INCREMENT
usuario_id     BIGINT FK → Usuario
total          DECIMAL(10,2) DEFAULT 0
estado         ENUM('PENDIENTE', 'COMPLETADA', 'ANULADA') DEFAULT 'PENDIENTE'
observaciones  VARCHAR(255)
fecha          DATETIME DEFAULT NOW()
```

### Entidad: DetalleVenta
```
id               BIGINT PK AUTO_INCREMENT
transaccion_id   BIGINT FK → Transaccion
producto_id      BIGINT FK → Producto
cantidad         INT NOT NULL
precioUnitario   DECIMAL(10,2) NOT NULL
subtotal         DECIMAL(10,2) NOT NULL
```

---

## Endpoints a implementar

### Autenticación
```
POST /api/auth/login
  Body: { "email": "...", "password": "..." }
  Response: { "token": "...", "usuario": { ... } }
```

### Productos
```
GET    /api/productos                          → listar todos activos
GET    /api/productos/{id}                     → obtener por id
GET    /api/productos/categoria/{categoria}    → filtrar por REPUESTO o LUBRICANTE
GET    /api/productos/bajo-stock              → productos con stock <= stockMinimo
POST   /api/productos                          → crear producto
PUT    /api/productos/{id}                     → actualizar producto
DELETE /api/productos/{id}                     → baja lógica (activo = false)
```

### Movimientos de stock
```
GET  /api/movimientos                          → listar todos
GET  /api/movimientos/producto/{productoId}    → historial por producto
POST /api/movimientos                          → registrar movimiento
  Body: { "productoId": 1, "tipo": "ENTRADA", "cantidad": 10, "nota": "..." }
  Al registrar: actualizar stockActual del producto automáticamente
  Si tipo=SALIDA y no hay stock suficiente → error 400
```

### Ventas
```
POST /api/ventas
  Body: {
    "observaciones": "...",
    "detalles": [
      { "productoId": 1, "cantidad": 2 }
    ]
  }
  Al crear: estado = PENDIENTE, calcular total automáticamente

PUT  /api/ventas/{id}/estado
  Body: { "estado": "COMPLETADA" }
  Si estado = COMPLETADA → descontar stock de cada producto (registrar movimiento SALIDA)
  Si estado = ANULADA → no modificar stock

GET  /api/ventas/{id}           → obtener venta con detalles
GET  /api/ventas                → listar ventas
```

### Reportes
```
GET /api/reportes/ventas?desde=2024-01-01&hasta=2024-12-31
  Response: {
    "periodo": { "desde": "...", "hasta": "..." },
    "totalVentas": 150000.00,
    "cantidadTransacciones": 45,
    "productosMasVendidos": [
      { "nombre": "Filtro de aceite", "cantidadVendida": 30 }
    ]
  }

GET /api/reportes/stock
  Response: lista de todos los productos con su stock actual y valor de inventario
```

---

## Reglas de negocio importantes

1. **Stock:** nunca puede ser negativo. Si una SALIDA deja el stock en negativo, lanzar `StockInsuficienteException`.
2. **Ventas:** el stock se descuenta únicamente cuando la transacción pasa a estado `COMPLETADA`.
3. **Baja de productos:** nunca eliminar físicamente. Usar `activo = false`.
4. **Movimientos:** siempre guardar `stockAnterior` y `stockPosterior` para trazabilidad.
5. **Precios en ventas:** guardar el `precioUnitario` al momento de la venta, no el precio actual del producto.
6. **Roles:** el rol `ADMIN` puede hacer todo. El rol `OPERADOR` no puede eliminar productos ni anular ventas.

---

## Seguridad

- Todos los endpoints (excepto `/api/auth/login`) requieren token JWT en el header:
  ```
  Authorization: Bearer <token>
  ```
- Configurar Spring Security para validar el token en cada request.
- El token debe incluir el email y el rol del usuario en los claims.
- Expiración del token: 24 horas (configurado en `application.properties`).

---

## Manejo de errores

Todos los errores deben retornar JSON con este formato:
```json
{
  "timestamp": "2024-01-15T10:30:00",
  "status": 404,
  "mensaje": "Producto no encontrado con id: 5"
}
```

Códigos de error esperados:
- `400` — datos inválidos o stock insuficiente
- `401` — no autenticado
- `403` — sin permisos
- `404` — recurso no encontrado
- `500` — error interno

---

## Configuración de la base de datos (PostgreSQL)

El archivo `application.properties` debe contener:
```properties
spring.datasource.url=${DB_URL:jdbc:postgresql://TU_HOST:5432/TU_DB?sslmode=require}
spring.datasource.username=${DB_USERNAME:postgres}
spring.datasource.password=${DB_PASSWORD:TU_PASSWORD}
spring.datasource.driver-class-name=org.postgresql.Driver
spring.jpa.hibernate.ddl-auto=update
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.show-sql=true
jwt.secret=clave_secreta_larga_y_segura
jwt.expiration=86400000
server.port=8080
springdoc.swagger-ui.path=/swagger-ui.html
```

Para cloud PostgreSQL, define `DB_URL`, `DB_USERNAME` y `DB_PASSWORD` en variables de entorno.

---

## Orden de implementación sugerido

1. Entidades JPA (`model/`)
2. Repositorios (`repository/`)
3. DTOs (`dto/`)
4. Seguridad JWT (`security/`)
5. Servicios (`service/`) — empezar por `ProductoService`
6. Controladores (`controller/`)
7. Manejo de excepciones (`exception/`)
8. Configuración Swagger (`config/`)

---

## Verificación final

Antes de terminar, verificar que:
- [ ] La app compila sin errores (`mvn clean package`)
- [ ] Todos los endpoints están documentados en Swagger
- [ ] Los errores retornan siempre JSON estructurado
- [ ] El stock nunca queda negativo
- [ ] El token JWT es requerido en todos los endpoints protegidos
# Stock-api
