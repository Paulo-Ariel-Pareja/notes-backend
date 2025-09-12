import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { User } from '../../users/entities/user.entity';
import { AppConfigService } from '../../config/config.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: AppConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    const jwtConfig = configService.jwt;
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.secret,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    });
  }

  /**
   * Validate JWT payload and return user
   * This method is called automatically by Passport after token verification
   * @param payload - Decoded JWT payload
   * @returns User entity or throws UnauthorizedException
   */
  async validate(payload: JwtPayload): Promise<User> {
    const { sub: userId } = payload;

    // Find user by ID from the token
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Return user object (will be attached to request.user)
    return user;
  }
}