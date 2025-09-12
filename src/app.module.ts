import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { AbacModule } from './abac/abac.module';
import { AuthModule } from './auth/auth.module';
import { NotesModule } from './notes/notes.module';
import { PublicLinksModule } from './public-links/public-links.module';
import { PublicModule } from './public/public.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    HealthModule,
    UsersModule,
    AbacModule,
    AuthModule,
    NotesModule,
    PublicLinksModule,
    PublicModule,
  ],
})
export class AppModule {}
