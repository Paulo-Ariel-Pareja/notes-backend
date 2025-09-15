# End-to-End (E2E) Tests

Este directorio contiene las pruebas end-to-end completas para el proyecto Notes Backend.

## 📋 Estructura de Pruebas

### 🧪 Suites de Pruebas

| Archivo | Descripción | Cobertura |
|---------|-------------|-----------|
| `app.e2e-spec.ts` | Bootstrap de aplicación | Configuración global, CORS, manejo de errores |
| `auth.e2e-spec.ts` | Autenticación | Login, JWT, validación de tokens |
| `users.e2e-spec.ts` | Gestión de usuarios | CRUD usuarios, cambio de contraseña |
| `notes.e2e-spec.ts` | Gestión de notas | CRUD notas, búsqueda, paginación |
| `public-links.e2e-spec.ts` | Enlaces públicos | Creación, gestión de enlaces compartidos |
| `public.e2e-spec.ts` | Acceso público | Acceso sin autenticación a notas compartidas |
| `health.e2e-spec.ts` | Health checks | Monitoreo de salud de la aplicación |
| `abac.e2e-spec.ts` | Autorización ABAC | Control de acceso basado en atributos |

### 🛠️ Utilidades

| Archivo | Propósito |
|---------|-----------|
| `utils/test-utils.ts` | Helpers y utilidades para pruebas |
| `setup-e2e.ts` | Configuración global de pruebas |
| `jest-e2e.json` | Configuración de Jest para E2E |

## 🚀 Ejecución de Pruebas

### Métodos de Ejecución

#### 1. **NPM Scripts**
```bash
# Todas las pruebas E2E
npm run test:e2e

# Con cobertura
npm run test:e2e -- --coverage

# Prueba específica
npm run test:e2e -- --testPathPattern="auth.e2e-spec.ts"
```

#### 2. **Scripts Personalizados**

**Linux/Mac:**
```bash
# Hacer ejecutable
chmod +x test/run-e2e.sh

# Todas las pruebas
./test/run-e2e.sh

# Pruebas específicas
./test/run-e2e.sh --auth
./test/run-e2e.sh --users
./test/run-e2e.sh --notes

# Con cobertura
./test/run-e2e.sh --coverage
```

**Windows:**
```cmd
# Todas las pruebas
test\run-e2e.bat

# Pruebas específicas
test\run-e2e.bat --auth
test\run-e2e.bat --users
test\run-e2e.bat --notes

# Con cobertura
test\run-e2e.bat --coverage
```

### Opciones Disponibles

| Opción | Descripción |
|--------|-------------|
| `--all` | Ejecutar todas las pruebas (por defecto) |
| `--auth` | Solo pruebas de autenticación |
| `--users` | Solo pruebas de gestión de usuarios |
| `--notes` | Solo pruebas de gestión de notas |
| `--public-links` | Solo pruebas de enlaces públicos |
| `--public` | Solo pruebas de acceso público |
| `--health` | Solo pruebas de health checks |
| `--abac` | Solo pruebas de autorización |
| `--app` | Solo pruebas de bootstrap |
| `--coverage` | Ejecutar con reporte de cobertura |
| `--help` | Mostrar ayuda |

## 🔧 Configuración

### Variables de Entorno de Prueba

Las pruebas E2E utilizan las siguientes variables de entorno:

```bash
NODE_ENV=test
DB_DATABASE=notes_db_test
DB_SYNCHRONIZE=true
DB_LOGGING=false
JWT_SECRET=test-secret-key
BCRYPT_ROUNDS=4  # Más rápido para pruebas
```

### Base de Datos de Prueba

- **Base de datos separada**: `notes_db_test`
- **Sincronización automática**: Habilitada
- **Limpieza automática**: Entre cada prueba
- **Aislamiento**: Cada suite es independiente

## 📊 Cobertura de Pruebas

### Áreas Cubiertas

#### ✅ **Autenticación y Autorización**
- Login con credenciales válidas/inválidas
- Validación de JWT tokens
- Control de acceso ABAC
- Políticas de autorización por roles

#### ✅ **Gestión de Usuarios**
- Creación de usuarios (solo admin)
- Listado y búsqueda de usuarios
- Cambio de contraseña
- Eliminación de usuarios

#### ✅ **Gestión de Notas**
- CRUD completo de notas
- Búsqueda y filtrado
- Paginación
- Estadísticas de usuario
- Control de propiedad

#### ✅ **Enlaces Públicos**
- Creación de enlaces compartidos
- Gestión de expiración
- Control de acceso
- Estadísticas de visualización

#### ✅ **Acceso Público**
- Acceso sin autenticación
- Incremento de contadores
- Manejo de enlaces expirados
- Seguridad de datos

#### ✅ **Health Checks**
- Estado de la aplicación
- Conectividad de base de datos
- Rendimiento de respuesta

#### ✅ **Validaciones**
- Validación de entrada
- Manejo de errores
- Respuestas consistentes
- Códigos de estado HTTP

### Métricas de Cobertura

```bash
# Generar reporte de cobertura
npm run test:e2e -- --coverage

# Ver reporte en navegador
open coverage-e2e/lcov-report/index.html
```

## 🧪 Estructura de Pruebas

### Patrón de Organización

```typescript
describe('Feature (e2e)', () => {
  let app: INestApplication;
  let testHelper: TestHelper;

  beforeAll(async () => {
    testHelper = new TestHelper();
    app = await testHelper.setupApp();
  });

  beforeEach(async () => {
    await testHelper.cleanDatabase();
  });

  afterAll(async () => {
    await testHelper.closeApp();
  });

  describe('Endpoint Group', () => {
    it('should handle success case', async () => {
      // Test implementation
    });

    it('should handle error case', async () => {
      // Test implementation
    });
  });
});
```

### Helpers Disponibles

#### **TestHelper Class**
```typescript
// Configuración de aplicación
await testHelper.setupApp()
await testHelper.cleanDatabase()
await testHelper.closeApp()

// Gestión de usuarios
const user = await testHelper.createUser(userData)
const token = await testHelper.loginUser(email, password)

// Gestión de notas
const note = await testHelper.createNote(token, noteData)
const publicLink = await testHelper.createPublicLink(token, noteId)

// Requests
testHelper.makeAuthenticatedRequest(token).get('/api/notes')
testHelper.makePublicRequest().get('/api/public/health')

// Assertions
testHelper.expectSuccess(response, 200)
testHelper.expectValidationError(response, 'email')
testHelper.expectUnauthorized(response)
testHelper.expectForbidden(response)
testHelper.expectNotFound(response)
```

## 🔍 Debugging

### Logs de Pruebas

```bash
# Ejecutar con logs detallados
npm run test:e2e -- --verbose

# Ver logs de base de datos
DB_LOGGING=true npm run test:e2e
```

### Debugging Individual

```bash
# Ejecutar una sola prueba
npm run test:e2e -- --testNamePattern="should login with valid credentials"

# Ejecutar con timeout extendido
npm run test:e2e -- --testTimeout=60000
```

### Problemas Comunes

#### **Base de datos no conecta**
```bash
# Verificar configuración
echo $DB_HOST $DB_PORT $DB_DATABASE

# Verificar servicio
docker-compose ps postgres
```

#### **Pruebas lentas**
```bash
# Reducir rounds de bcrypt
export BCRYPT_ROUNDS=1

# Usar base de datos en memoria (SQLite)
export DB_TYPE=sqlite
export DB_DATABASE=:memory:
```

#### **Timeouts**
```bash
# Aumentar timeout global
export JEST_TIMEOUT=30000

# O en jest-e2e.json
{
  "testTimeout": 30000
}
```

## 📈 Mejores Prácticas

### ✅ **Hacer**
- Limpiar base de datos entre pruebas
- Usar datos únicos (timestamps)
- Probar casos de éxito y error
- Verificar códigos de estado HTTP
- Usar helpers para operaciones comunes
- Mantener pruebas independientes

### ❌ **No Hacer**
- Depender del orden de ejecución
- Usar datos hardcodeados
- Ignorar limpieza de recursos
- Probar solo casos felices
- Hacer pruebas muy largas
- Compartir estado entre pruebas

### 🎯 **Consejos**
- Usar `beforeEach` para limpieza
- Crear usuarios únicos por prueba
- Verificar tanto datos como códigos de estado
- Probar límites y validaciones
- Documentar casos de prueba complejos

## 🚀 CI/CD Integration

### GitHub Actions
```yaml
- name: Run E2E Tests
  run: |
    npm ci
    npm run build
    npm run test:e2e
  env:
    NODE_ENV: test
    DB_HOST: localhost
    DB_PORT: 5432
    DB_USERNAME: postgres
    DB_PASSWORD: postgres
    DB_DATABASE: notes_db_test
```

### Docker
```bash
# Ejecutar pruebas en contenedor
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## 📚 Referencias

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [TypeORM Testing](https://typeorm.io/testing)