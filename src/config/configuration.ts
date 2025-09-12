export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'notes_db',
    ssl: process.env.DB_SSL === 'true',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.DB_LOGGING === 'true',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10),
    connectionTimeout: parseInt(
      process.env.DB_CONNECTION_TIMEOUT || '30000',
      10,
    ),
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    issuer: process.env.JWT_ISSUER || 'notes-backend',
    audience: process.env.JWT_AUDIENCE || 'notes-app',
  },

  // Security Configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    corsOrigin: process.env.CORS_ORIGIN || '*',
    rateLimitTtl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
    rateLimitLimit: parseInt(process.env.RATE_LIMIT_LIMIT || '100', 10),
  },

  // Application Configuration
  app: {
    name: process.env.APP_NAME || 'Notes Backend',
    version: process.env.APP_VERSION || '1.0.0',
    description:
      process.env.APP_DESCRIPTION || 'Notes management backend service',
    globalPrefix: process.env.GLOBAL_PREFIX || 'api',
    saUser: process.env.SA_USER || 'superuser@notes.com',
    saPassword: process.env.superpassword || 'superpassword',
    swaggerEnabled: process.env.SWAGGER_ENABLED !== 'false',
    swaggerPath: process.env.SWAGGER_PATH || 'docs',
  },

  // Logging Configurationv
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
    enableConsole: process.env.LOG_CONSOLE !== 'false',
    enableFile: process.env.LOG_FILE === 'true',
    filePath: process.env.LOG_FILE_PATH || 'logs/app.log',
  },
});
