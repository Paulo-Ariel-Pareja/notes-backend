import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { User } from '../users/entities/user.entity';

@Injectable()
export class JwtAuthService {
  private readonly expiresIn: string;
  constructor(
    private readonly jwtService: NestJwtService,
    private readonly configService: ConfigService,
  ) {
    this.expiresIn = this.configService.get<string>('jwt.expiresIn') || '1h';
  }

  generateToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  verifyToken(token: string): JwtPayload {
    return this.jwtService.verify(token);
  }

  decodeToken(token: string): JwtPayload | null {
    return this.jwtService.decode(token);
  }

  getTokenExpirationTime(): number {
    const timeUnit = this.expiresIn.slice(-1);
    const timeValue = parseInt(this.expiresIn.slice(0, -1));

    if (isNaN(timeValue)) return 3600;

    switch (timeUnit) {
      case 's':
        return timeValue;
      case 'm':
        return timeValue * 60;
      case 'h':
        return timeValue * 60 * 60;
      case 'd':
        return timeValue * 24 * 60 * 60;
      default:
        return 3600;
    }
  }
}
