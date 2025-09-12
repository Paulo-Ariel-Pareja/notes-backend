import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { AppConfigService } from './config/config.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    const configService = app.get(AppConfigService);

    // Set global prefix
    app.setGlobalPrefix(configService.app.globalPrefix);

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        disableErrorMessages: configService.isProduction,
      }),
    );

    // Global exception filter
    app.useGlobalFilters(new GlobalExceptionFilter());

    // Configure CORS
    app.enableCors({
      origin: configService.security.corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // Setup Swagger/OpenAPI documentation
    if (configService.app.swaggerEnabled) {
      const config = new DocumentBuilder()
        .setTitle(configService.app.name)
        .setDescription(configService.app.description)
        .setVersion(configService.app.version)
        .addBearerAuth(
          {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            name: 'JWT',
            description: 'Enter JWT token',
            in: 'header',
          },
          'JWT-auth',
        )
        .addTag(
          'Authentication',
          'User authentication and JWT token management',
        )
        .addTag('Users', 'User management (admin only)')
        .addTag('Notes', 'Personal notes management')
        .addTag('Public', 'Public access to shared notes')
        .addTag('Health', 'Application health checks')
        .addServer(
          `http://localhost:${configService.port}`,
          'Development server',
        )
        .build();

      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup(
        `${configService.app.globalPrefix}/${configService.app.swaggerPath}`,
        app,
        document,
        {
          swaggerOptions: {
            persistAuthorization: true,
            tagsSorter: 'alpha',
            operationsSorter: 'alpha',
          },
        },
      );

      logger.log(
        `📚 Swagger documentation enabled at /${configService.app.globalPrefix}/${configService.app.swaggerPath}`,
      );
    }

    if (configService.isProduction) {
      // Security headers
      // In production, you might want to add helmet for security headers
      logger.log(
        'Production mode: Security headers should be configured via reverse proxy',
      );
    }

    const port = configService.port;
    const host = '0.0.0.0';

    await app.listen(port, host);

    logger.log(`🚀 Application is running on: http://${host}:${port}`);
    logger.log(
      `📚 API Documentation: http://${host}:${port}/${configService.app.globalPrefix}/${configService.app.swaggerPath}`,
    );
    logger.log(`🌍 Environment: ${configService.nodeEnv}`);
    logger.log(
      `📊 Health Check: http://${host}:${port}/${configService.app.globalPrefix}/health`,
    );
  } catch (error) {
    logger.error('Failed to start application', error);
    process.exit(1);
  }
}

bootstrap();
