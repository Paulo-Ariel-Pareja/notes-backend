import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Check if the route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    // Call the parent canActivate method to perform JWT validation
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    console.log('JWT Auth Guard 2 - handleRequest called');

    if (err || !user) {
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers.authorization;

      if (!authHeader) {
        throw new UnauthorizedException('Authorization header is missing');
      }

      if (!authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Invalid authorization header format');
      }

      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }

      if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }

      if (info?.name === 'NotBeforeError') {
        throw new UnauthorizedException('Token not active');
      }

      throw new UnauthorizedException('Authentication failed');
    }

    return user;
  }
}