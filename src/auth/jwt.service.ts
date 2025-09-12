import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { User } from '../users/entities/user.entity';

@Injectable()
export class JwtAuthService {
  constructor(
    private readonly jwtService: NestJwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate JWT token for a user
   * @param user - User entity
   * @returns JWT token string
   */
  generateToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Verify and decode JWT token
   * @param token - JWT token string
   * @returns Decoded JWT payload
   */
  verifyToken(token: string): JwtPayload {
    return this.jwtService.verify(token);
  }

  /**
   * Decode JWT token without verification (for debugging)
   * @param token - JWT token string
   * @returns Decoded JWT payload
   */
  decodeToken(token: string): JwtPayload | null {
    return this.jwtService.decode(token);
  }

  /**
   * Generate refresh token (for future implementation)
   * @param user - User entity
   * @returns Refresh token string
   */
  generateRefreshToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload, {
      expiresIn: '7d', // Refresh tokens last longer
    });
  }

  /**
   * Get token expiration time
   * @returns Token expiration time in seconds
   */
  getTokenExpirationTime(): number {
    const expiresIn = this.configService.get<string>('jwt.expiresIn') || '1h';

    // Convert string like '1h', '30m', '7d' to seconds
    const timeUnit = expiresIn.slice(-1);
    const timeValue = parseInt(expiresIn.slice(0, -1));

    // Check if timeValue is valid
    if (isNaN(timeValue)) {
      return 3600; // Default to 1 hour
    }

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
        return 3600; // Default to 1 hour
    }
  }
}
