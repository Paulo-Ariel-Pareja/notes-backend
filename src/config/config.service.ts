import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
  synchronize: boolean;
  logging: boolean;
  maxConnections: number;
  connectionTimeout: number;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  issuer: string;
  audience: string;
}

export interface SecurityConfig {
  bcryptRounds: number;
  corsOrigin: string;
  rateLimitTtl: number;
  rateLimitLimit: number;
}

export interface AppConfig {
  name: string;
  version: string;
  description: string;
  globalPrefix: string;
  swaggerEnabled: boolean;
  saUser: string;
  saPassword: string;
  swaggerPath: string;
}

export interface LoggingConfig {
  level: string;
  format: string;
  enableConsole: boolean;
  enableFile: boolean;
  filePath: string;
}

@Injectable()
export class AppConfigService {
  constructor(private configService: NestConfigService) {}

  get nodeEnv(): string {
    return this.configService.get<string>('nodeEnv', 'development');
  }

  get port(): number {
    return this.configService.get<number>('port', 3000);
  }

  get database(): DatabaseConfig {
    return {
      host: this.configService.get<string>('database.host', 'localhost'),
      port: this.configService.get<number>('database.port', 5432),
      username: this.configService.get<string>('database.username', 'postgres'),
      password: this.configService.get<string>('database.password', 'password'),
      database: this.configService.get<string>('database.database', 'notes_db'),
      ssl: this.configService.get<boolean>('database.ssl', false),
      synchronize: this.configService.get<boolean>(
        'database.synchronize',
        false,
      ),
      logging: this.configService.get<boolean>('database.logging', false),
      maxConnections: this.configService.get<number>(
        'database.maxConnections',
        10,
      ),
      connectionTimeout: this.configService.get<number>(
        'database.connectionTimeout',
        30000,
      ),
    };
  }

  get jwt(): JwtConfig {
    return {
      secret: this.configService.get<string>(
        'jwt.secret',
        'fallback-secret-key',
      ),
      expiresIn: this.configService.get<string>('jwt.expiresIn', '1h'),
      issuer: this.configService.get<string>('jwt.issuer', 'notes-backend'),
      audience: this.configService.get<string>('jwt.audience', 'notes-app'),
    };
  }

  get security(): SecurityConfig {
    return {
      bcryptRounds: this.configService.get<number>('security.bcryptRounds', 12),
      corsOrigin: this.configService.get<string>('security.corsOrigin', '*'),
      rateLimitTtl: this.configService.get<number>('security.rateLimitTtl', 60),
      rateLimitLimit: this.configService.get<number>(
        'security.rateLimitLimit',
        100,
      ),
    };
  }

  get app(): AppConfig {
    return {
      name: this.configService.get<string>('app.name', 'Notes Backend'),
      version: this.configService.get<string>('app.version', '1.0.0'),
      description: this.configService.get<string>(
        'app.description',
        'Notes management backend service',
      ),
      globalPrefix: this.configService.get<string>('app.globalPrefix', 'api'),
      saUser: this.configService.get<string>('app.saUser', 'superuser@notes.com'),
      saPassword: this.configService.get<string>('app.saPassword', 'superpassword'),
      swaggerEnabled: this.configService.get<boolean>(
        'app.swaggerEnabled',
        true,
      ),
      swaggerPath: this.configService.get<string>('app.swaggerPath', 'docs'),
    };
  }

  get logging(): LoggingConfig {
    return {
      level: this.configService.get<string>('logging.level', 'info'),
      format: this.configService.get<string>('logging.format', 'combined'),
      enableConsole: this.configService.get<boolean>(
        'logging.enableConsole',
        true,
      ),
      enableFile: this.configService.get<boolean>('logging.enableFile', false),
      filePath: this.configService.get<string>(
        'logging.filePath',
        'logs/app.log',
      ),
    };
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }
}
