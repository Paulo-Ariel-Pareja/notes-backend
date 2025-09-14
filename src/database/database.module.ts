import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigService } from '../config/config.service';
import { DatabaseInitService } from './database-init.service';
import { User } from '../users/entities/user.entity';
import { PasswordService } from '../common/services/password.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: AppConfigService) => {
        const dbConfig = configService.database;

        return {
          type: 'postgres',
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.database,
          ssl: dbConfig.ssl ? { rejectUnauthorized: false } : false,
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          synchronize: dbConfig.synchronize,
          logging: dbConfig.logging,
          maxQueryExecutionTime: 1000,
          extra: {
            max: dbConfig.maxConnections,
            connectionTimeoutMillis: dbConfig.connectionTimeout,
            idleTimeoutMillis: 30000,
          },
          poolSize: dbConfig.maxConnections,
          retryAttempts: 3,
          retryDelay: 3000,
        };
      },
      inject: [AppConfigService],
    }),
    TypeOrmModule.forFeature([User]),
  ],
  providers: [DatabaseInitService, PasswordService],
})
export class DatabaseModule {}
