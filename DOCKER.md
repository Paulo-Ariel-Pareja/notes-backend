# Docker Setup for Notes Backend

Este documento explica cómo ejecutar la aplicación Notes Backend usando Docker y Docker Compose.

## 📋 Prerrequisitos

- Docker Engine 20.10+
- Docker Compose 2.0+

## 🚀 Inicio Rápido

### Producción

1. **Clonar el repositorio y navegar al directorio:**
   ```bash
   git clone https://github.com/Paulo-Ariel-Pareja/notes-backend
   cd notes-backend
   ```

2. **Levantar los servicios:**
   ```bash
   yarn run docker:prod
   ```

3. **Verificar que los servicios estén corriendo:**
   ```bash
   docker-compose ps
   ```

4. **Acceder a la aplicación:**
   - API: http://localhost:3001/api

### Desarrollo

1. **Usar el docker-compose de desarrollo:**
   ```bash
   yarn run docker:dev
   ```

2. **Acceder a la aplicación de desarrollo:**
   - API: http://localhost:3000/api
   - Swagger UI: http://localhost:3000/api/docs

## 🏗️ Arquitectura de Servicios

### Servicios Incluidos

1. **notes-backend**: Aplicación principal NestJS
2. **postgres**: Base de datos PostgreSQL 15

### Puertos Expuestos

- **3001**: API Backend (desarrollo)
- **5434**: PostgreSQL (desarrollo)
- **3000**: API Backend (producción)
- **5433**: PostgreSQL (producción)

## 🔧 Configuración

### Variables de Entorno

Las variables de entorno están configuradas en el `docker-compose.yml`. Para personalizarlas:

1. **Copia el archivo de ejemplo:**
   ```bash
   cp .env.example .env
   ```

2. **Edita las variables según tus necesidades:**
   ```bash
   nano .env
   ```

3. **Usa el archivo .env en docker-compose:**
   ```yaml
   # En docker-compose.yml, reemplaza la sección environment con:
   env_file:
     - .env
   ```

### Credenciales por Defecto en Dev

#### Base de Datos
- **Usuario**: notes_user
- **Contraseña**: notes123
- **Base de datos**: notes_db_dev

#### Aplicación
- **Super Admin**: admindev@notes.com
- **Contraseña**: desarrollo

### Credenciales por Defecto en Prod

#### Base de Datos
- **Usuario**: postgres
- **Contraseña**: postgres123
- **Base de datos**: notes_db

#### Aplicación
- **Super Admin**: adminprod@notes.com
- **Contraseña**: produccion

## 📊 Comandos Útiles

### Gestión de Contenedores

```bash
# Levantar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f notes-backend
docker-compose logs -f postgres

# Parar servicios
docker-compose down

# Parar y eliminar volúmenes (¡CUIDADO: elimina datos!)
docker-compose down -v

# Reconstruir imágenes
docker-compose build --no-cache

# Reiniciar un servicio específico
docker-compose restart notes-backend-dev
docker-compose restart notes-backend
```

### Base de Datos

```bash
# Conectar a PostgreSQL
docker-compose exec postgres psql -U postgres -d notes_db

# Backup de la base de datos
docker-compose exec postgres pg_dump -U postgres notes_db > backup.sql

# Restaurar backup
docker-compose exec -T postgres psql -U postgres notes_db < backup.sql

# Ver logs de PostgreSQL
docker-compose logs postgres
```

### Aplicación

```bash
# Ver logs de la aplicación
docker-compose logs -f notes-backend

# Ejecutar comandos dentro del contenedor
docker-compose exec notes-backend sh

# Reiniciar solo la aplicación
docker-compose restart notes-backend
```

## 🔍 Monitoreo y Debugging

### Health Checks

Los servicios incluyen health checks automáticos:

```bash
# Ver estado de salud
docker-compose ps

# Verificar health check manualmente
curl http://localhost:3000/api/health
curl http://localhost:3001/api/health
```

### Logs

```bash
# Todos los logs
docker-compose logs

# Logs en tiempo real
docker-compose logs -f

# Logs de un servicio específico
docker-compose logs notes-backend
```

## 🛠️ Desarrollo

### Hot Reload

El docker-compose de desarrollo incluye hot reload:

```bash
# Levantar en modo desarrollo
docker-compose -f docker-compose.dev.yml up -d

# Los cambios en el código se reflejan automáticamente
```

### Debugging

Para debugging con breakpoints:

```bash
# Modificar docker-compose.dev.yml para exponer puerto de debug
ports:
  - "3001:3000"
  - "9229:9229"  # Puerto de debug

# Usar comando de debug
command: npm run start:debug
```

## 🔒 Seguridad

### Producción

Para producción, asegúrate de:

1. **Cambiar credenciales por defecto**
2. **Usar secretos seguros para JWT**
3. **Configurar CORS apropiadamente**
4. **Usar HTTPS con un reverse proxy**
5. **Limitar acceso a puertos de base de datos**

### Ejemplo con Nginx

```yaml
# Agregar nginx como reverse proxy
nginx:
  image: nginx:alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf
  depends_on:
    - notes-backend
```

## 🚨 Troubleshooting

### Problemas Comunes

1. **Puerto ya en uso:**
   ```bash
   # Cambiar puertos en docker-compose.yml
   ports:
     - "3001:3000"  # Usar puerto diferente
   ```

2. **Base de datos no conecta:**
   ```bash
   # Verificar que postgres esté healthy
   docker-compose ps
   
   # Ver logs de postgres
   docker-compose logs postgres
   ```

3. **Aplicación no inicia:**
   ```bash
   # Ver logs detallados
   docker-compose logs notes-backend
   
   # Verificar variables de entorno
   docker-compose exec notes-backend env
   ```

4. **Limpiar todo y empezar de nuevo:**
   ```bash
   docker-compose down -v
   docker system prune -a
   docker-compose up -d
   ```

## 📚 Referencias

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [NestJS Documentation](https://nestjs.com/)