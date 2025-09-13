# 📝 Notes Backend API

API RESTful construida con NestJS para gestionar notas personales con características de seguridad y compartición.

## ✨ Características principales

- 🔐 **Autenticación segura** basada en JWT
- 👥 **Control de acceso basado en atributos (ABAC)** para una gestión granular de permisos
- 📋 **Gestión completa de notas**
  - Crear, leer, actualizar y eliminar notas
  - Búsqueda y filtrado avanzado
  - Organización por categorías
- 🔗 **Enlaces públicos**
  - Generar enlaces para compartir notas específicas
  - Control total sobre la visibilidad
- 👮 **Panel de administración**
  - Gestión de usuarios
  - Monitoreo de actividad
  - Estadísticas de uso

## 🛠️ Tecnologías

- [NestJS](https://nestjs.com/) - Framework backend moderno y escalable
- [TypeScript](https://www.typescriptlang.org/) - Tipado estático para JavaScript
- [TypeORM](https://typeorm.io/) - ORM para bases de datos
- [PostgreSQL](https://www.postgresql.org/) - Base de datos relacional
- [Jest](https://jestjs.io/) - Framework de testing
- [JWT](https://jwt.io/) - Tokens para autenticación segura

## 🚀 Inicio rápido

### Prerrequisitos

- Node.js (v18 o superior)
- PostgreSQL
- Yarn

### Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/Paulo-Ariel-Pareja/notes-backend.git
cd notes-backend
```

2. Instalar dependencias:
```bash
yarn install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

4. Iniciar el servidor:
```bash
# Desarrollo
yarn start:dev

# Producción
yarn start:prod
```

## 🧪 Testing

```bash
# Tests unitarios
yarn test

# Tests de integración
yarn test:e2e

# Cobertura de código
yarn test:cov
```
## 🐳 Docker

- Este proyecto incluye soporte para Docker.
- Puedes construir y ejecutar el backend usando contenedores para facilitar el despliegue y la portabilidad.

### Comandos básicos

```bash
# Construir la imagen
yarn run docker:dev
```
```bash
yarn run docker:prod

```

## 📚 API Documentation

La documentación de la API está disponible en:
- Swagger UI: `http://localhost:3000/api`
- Postman Collection: [Ver documentación](./docs/notes-backend.postman_collection.json)

## 🔑 Seguridad

El proyecto implementa varias capas de seguridad:

- Autenticación JWT
- Control de acceso basado en atributos (ABAC)
- Validación de entrada
- Rate limiting [TO-DO]

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor, lee nuestra [guía de contribución](CONTRIBUTING.md) para más detalles.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Autores

- [Paulo Ariel Pareja](https://github.com/Paulo-Ariel-Pareja)

---

¿Encontraste útil este proyecto? ¡Dale una ⭐!
