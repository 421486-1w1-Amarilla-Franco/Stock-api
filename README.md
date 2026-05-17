# Stock API — Sistema de control de inventario

Sistema fullstack para gestión de stock en un taller mecánico. Permite administrar productos, registrar ventas y movimientos, y visualizar el estado del negocio desde un dashboard en tiempo real.

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Spring Boot 3.2, Java 21, Spring Data JPA, Spring Security + JWT |
| Base de datos | PostgreSQL (Supabase) |
| Frontend | React 18, TypeScript, Vite |
| Estado cliente | TanStack Query v5 |
| Estilos | CSS Variables (design tokens light/dark) |

---

## Estructura del proyecto

```
stock-api/
├── backend/                  # Spring Boot
│   ├── pom.xml
│   └── src/
│       └── main/
│           ├── java/com/stockapi/
│           │   ├── config/       # CORS, Swagger, DataInitializer
│           │   ├── controller/   # REST controllers
│           │   ├── dto/          # Request / Response DTOs
│           │   ├── exception/    # GlobalExceptionHandler
│           │   ├── model/        # Entidades JPA
│           │   ├── repository/   # Spring Data repositories
│           │   ├── security/     # JWT filter, SecurityConfig
│           │   └── service/      # Lógica de negocio
│           └── resources/
│               └── application.properties.example
├── frontend/                 # React + TypeScript
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── components/       # UI reutilizable (Drawer, Toast, TipoChip…)
│       ├── hooks/            # useProductos, useVentas, useMovimientos…
│       ├── lib/              # api.ts (Axios + JWT), format.ts
│       ├── pages/            # Dashboard, Productos, Ventas, Movimientos
│       ├── styles/           # index.css (design tokens + componentes)
│       └── types/            # api.ts (interfaces TypeScript)
└── docs/
    ├── db-setup.sql          # Schema inicial de la base de datos
    └── design/
        ├── handoff/          # Especificaciones de diseño por fase (01–08)
        └── dashboard/        # Prototipo HTML del dashboard
```

---

## Requisitos previos

- Java 21+
- Apache Maven 3.8+
- Node.js 20+ / npm 10+
- PostgreSQL 15+ (o cuenta en Supabase)

---

## Setup

### 1. Base de datos

Ejecutar `docs/db-setup.sql` en tu instancia de PostgreSQL para crear el schema inicial.

Si usás Supabase, podés correrlo directamente desde el SQL Editor del dashboard.

### 2. Backend

```bash
cd backend

# Copiar el archivo de configuración y completarlo con tus valores
cp src/main/resources/application.properties.example \
   src/main/resources/application.properties

# Editar application.properties con tu URL, usuario y contraseña de BD,
# y un JWT secret seguro (mínimo 32 caracteres)

# Levantar el servidor (puerto 8080 por defecto)
mvn spring-boot:run
```

> El servidor levanta en `http://localhost:8080`. La documentación Swagger está en `/swagger-ui.html`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

> La app corre en `http://localhost:5173`. El proxy de Vite redirige `/api/*` → `http://localhost:8080`.

---

## Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/auth/login` | Login → devuelve JWT |
| `GET` | `/api/productos` | Listar productos activos |
| `POST` | `/api/productos` | Crear producto |
| `PUT` | `/api/productos/{id}` | Actualizar producto |
| `DELETE` | `/api/productos/{id}` | Baja lógica (activo = false) |
| `GET` | `/api/productos/bajo-stock` | Productos bajo stock mínimo |
| `GET` | `/api/ventas` | Listar ventas |
| `POST` | `/api/ventas` | Crear venta (descuenta stock inmediatamente) |
| `PUT` | `/api/ventas/{id}/estado` | Cambiar estado (ANULADA devuelve stock) |
| `GET` | `/api/movimientos` | Historial de movimientos |
| `POST` | `/api/movimientos` | Registrar movimiento manual |
| `GET` | `/api/reportes/stock` | Valor total del inventario |
| `GET` | `/api/reportes/ventas` | Reporte de ventas por período |

Todos los endpoints (excepto `/api/auth/*`) requieren el header:
```
Authorization: Bearer <token>
```

---

## Roles

| Rol | Permisos |
|---|---|
| `ADMIN` | Acceso completo: crear, editar, eliminar productos y ventas |
| `OPERADOR` | Solo lectura y creación de ventas; no puede eliminar ni acceder a Usuarios |

---

## Modelo de datos (simplificado)

```
Usuario       (id, nombre, email, password, rol)
Producto      (id, nombre, codigo, categoria, precioCosto, precioVenta,
               stockActual, stockMinimo, activo)
Transaccion   (id, usuario, estado, total, observaciones, fecha)
  └─ DetalleVenta (productoId, cantidad, precioUnitario)
Movimiento    (id, producto, usuario, tipo, cantidad,
               stockAnterior, stockPosterior, nota, fecha)
```

**Enums:**
- `Categoria`: `REPUESTO` | `LUBRICANTE`
- `TipoMovimiento`: `ENTRADA` | `SALIDA` | `AJUSTE`
- `EstadoVenta`: `PENDIENTE` | `COMPLETADA` | `ANULADA`
- `Rol`: `ADMIN` | `OPERADOR`

---

## Reglas de negocio

- Las ventas se crean directamente como `COMPLETADA` y descuentan el stock en el mismo acto.
- Anular una venta (`ANULADA`) restaura el stock y registra movimientos `ENTRADA` automáticos.
- Los movimientos `AJUSTE` usan delta firmado: valor positivo suma, negativo resta.
- La baja de productos es **lógica** (`activo = false`); se pueden reactivar.

---

## Variables de entorno del backend

Ver `backend/src/main/resources/application.properties.example` para la lista completa.

Las variables críticas son:

```properties
spring.datasource.url=jdbc:postgresql://<HOST>:<PORT>/postgres?sslmode=require
spring.datasource.username=<DB_USER>
spring.datasource.password=<DB_PASSWORD>
jwt.secret=<JWT_SECRET_MIN_32_CHARS>
```

> **Nunca commitear** `application.properties` con credenciales reales. El archivo está en `.gitignore`.

---

## Scripts útiles

```bash
# Backend
mvn spring-boot:run          # desarrollo
mvn clean package            # compilar JAR
mvn test                     # tests

# Frontend
npm run dev                  # desarrollo (HMR)
npm run build                # build de producción
npm run preview              # preview del build
npx tsc --noEmit             # verificar tipos sin compilar
```
