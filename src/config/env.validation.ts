import { plainToInstance, Transform } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsString,
  IsOptional,
  IsBoolean,
  MinLength,
  IsIn,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

enum LogLevel {
  Error = 'error',
  Warn = 'warn',
  Info = 'info',
  Debug = 'debug',
  Verbose = 'verbose',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  PORT: number = 3000;

  // Database Configuration
  @IsString()
  DB_HOST: string = 'localhost';

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  DB_PORT: number = 5432;

  @IsString()
  DB_USERNAME: string;

  @IsString()
  DB_PASSWORD: string;

  @IsString()
  DB_DATABASE: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  DB_SSL?: boolean = false;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  DB_SYNCHRONIZE?: boolean = false;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  DB_LOGGING?: boolean = false;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  DB_MAX_CONNECTIONS?: number = 10;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  DB_CONNECTION_TIMEOUT?: number = 30000;

  // JWT Configuration
  @IsString()
  @MinLength(32, {
    message:
      'JWT_SECRET must be at least 32 characters long for production security',
  })
  JWT_SECRET: string;

  @IsString()
  JWT_EXPIRES_IN: string = '1h';

  @IsOptional()
  @IsString()
  JWT_ISSUER?: string = 'notes-backend';

  @IsOptional()
  @IsString()
  JWT_AUDIENCE?: string = 'notes-app';

  // Security Configuration
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  BCRYPT_ROUNDS?: number = 12;

  @IsOptional()
  @IsString()
  CORS_ORIGIN?: string = '*';

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  RATE_LIMIT_TTL?: number = 60;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  RATE_LIMIT_LIMIT?: number = 100;

  // Application Configuration
  @IsOptional()
  @IsString()
  APP_NAME?: string = 'Notes Backend';

  @IsOptional()
  @IsString()
  APP_VERSION?: string = '1.0.0';

  @IsOptional()
  @IsString()
  APP_DESCRIPTION?: string = 'Notes management backend service';

  @IsOptional()
  @IsString()
  GLOBAL_PREFIX?: string = 'api';

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value !== 'false')
  SWAGGER_ENABLED?: boolean = true;

  @IsOptional()
  @IsString()
  SWAGGER_PATH?: string = 'docs';

  // Logging Configuration
  @IsOptional()
  @IsEnum(LogLevel)
  LOG_LEVEL?: LogLevel = LogLevel.Info;

  @IsOptional()
  @IsString()
  LOG_FORMAT?: string = 'combined';

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value !== 'false')
  LOG_CONSOLE?: boolean = true;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  LOG_FILE?: boolean = false;

  @IsOptional()
  @IsString()
  LOG_FILE_PATH?: string = 'logs/app.log';
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .map((error) => {
        const constraints = Object.values(error.constraints || {});
        return `${error.property}: ${constraints.join(', ')}`;
      })
      .join('\n');

    throw new Error(`Environment validation failed:\n${errorMessages}`);
  }

  // Additional production-specific validations
  if (validatedConfig.NODE_ENV === Environment.Production) {
    validateProductionConfig(validatedConfig);
  }

  return validatedConfig;
}

function validateProductionConfig(config: EnvironmentVariables) {
  const productionErrors: string[] = [];

  // Ensure JWT secret is strong in production
  if (
    config.JWT_SECRET === 'fallback-secret-key' ||
    config.JWT_SECRET.length < 32
  ) {
    productionErrors.push(
      'JWT_SECRET must be a strong secret (at least 32 characters) in production',
    );
  }

  // Ensure database password is not default
  if (config.DB_PASSWORD === 'password') {
    productionErrors.push(
      'DB_PASSWORD must not use default values in production',
    );
  }

  // Ensure SSL is enabled for production database
  if (!config.DB_SSL) {
    productionErrors.push(
      'DB_SSL should be enabled in production for security',
    );
  }

  // Ensure synchronize is disabled in production
  if (config.DB_SYNCHRONIZE) {
    productionErrors.push(
      'DB_SYNCHRONIZE must be disabled in production to prevent data loss',
    );
  }

  // Ensure CORS is properly configured
  if (config.CORS_ORIGIN === '*') {
    productionErrors.push(
      'CORS_ORIGIN should not be wildcard (*) in production',
    );
  }

  // Ensure Swagger is disabled in production
  if (config.SWAGGER_ENABLED) {
    productionErrors.push(
      'SWAGGER_ENABLED should be disabled in production for security',
    );
  }

  if (productionErrors.length > 0) {
    throw new Error(
      `Production environment validation failed:\n${productionErrors.join('\n')}`,
    );
  }
}
