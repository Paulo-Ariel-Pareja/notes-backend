import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthService } from './jwt.service';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthController } from './auth.controller';
import { User } from '../users/entities/user.entity';
import { AppConfigService } from '../config/config.service';
import { PasswordService } from '../common/services/password.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: (configService: AppConfigService) => {
        const jwtConfig = configService.jwt;

        return {
          secret: jwtConfig.secret,
          signOptions: {
            expiresIn: jwtConfig.expiresIn,
            issuer: jwtConfig.issuer,
            audience: jwtConfig.audience,
          },
          verifyOptions: {
            issuer: jwtConfig.issuer,
            audience: jwtConfig.audience,
          },
        };
      },
      inject: [AppConfigService],
    }),
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthService, JwtStrategy, PasswordService],
  exports: [AuthService, JwtAuthService, PassportModule],
})
export class AuthModule {}
