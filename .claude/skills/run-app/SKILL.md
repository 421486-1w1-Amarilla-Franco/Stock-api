---
name: run-app
description: Levantar Stock API en local (Postgres en Docker + backend Spring Boot + frontend Vite) y verificar que responde. Usar cuando haya que correr, arrancar o probar la app localmente.
---

# Correr Stock API en local

Requiere Java 21, Maven, Node 20+, Docker Desktop. Ver `README.md` para
la variante con Supabase; esto es el camino local sin credenciales reales.

## 1. Base de datos

```bash
docker run -d --name stockapi-pg \
  -e POSTGRES_PASSWORD=stockapi -e POSTGRES_DB=postgres \
  -p 5433:5432 postgres:16-alpine
```

Puerto 5433 para no chocar con un Postgres local. No hace falta correr
`docs/db-setup.sql`: Flyway aplica las migraciones (`db/migration`) al arrancar y
`DataInitializer` siembra el admin en el primer arranque.

Si el contenedor ya existe: `docker start stockapi-pg`.

## 2. Backend

`backend/src/main/resources/application.properties` usa placeholders
(`${DATABASE_URL}` etc.). El perfil `local` los sobreescribe desde
`application-local.properties` (gitignored). Crearlo si no existe:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5433/postgres
spring.datasource.username=postgres
spring.datasource.password=stockapi

jwt.secret=dev-local-secret-solo-para-desarrollo-no-usar-en-prod
```

```bash
cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=local
```

Levanta en :8080. Swagger en `/swagger-ui.html`. Tarda ~40s la primera vez.

## 3. Frontend

```bash
cd frontend && npm install && npm run dev
```

:5173, con proxy `/api/*` → :8080 (solo en `mode === 'development'`).

## 4. Verificar

```bash
# 401 sin token = backend arriba y seguro
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/api/productos

TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@stockapi.com","password":"Admin123"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

curl -s http://localhost:8080/api/productos -H "Authorization: Bearer $TOKEN"
```

Credenciales sembradas: `admin@stockapi.com` / `Admin123`
(`backend/src/main/java/com/stockapi/config/DataInitializer.java`).

Para cargar un producto de prueba:

```bash
curl -s -X POST http://localhost:8080/api/productos \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"nombre":"Filtro de aceite","codigo":"FA-001","categoria":"REPUESTO","precioCosto":4500,"precioVenta":7900,"stockActual":12,"stockMinimo":4}'
```

## 5. Bajar todo

Cortar los dos procesos (Ctrl+C) y:

```bash
docker stop stockapi-pg     # conserva los datos
docker rm -f stockapi-pg    # los borra
```
