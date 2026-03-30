import {
  ForbiddenException,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Response, Request } from 'express';
import { JwtPayloadAuth } from '../dto/jwtPayloadAuth.dto';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthMiddleware implements NestMiddleware {
  private readonly clientId: string;
  private readonly jwtSecret: string;

  constructor(private config: ConfigService) {
    this.clientId = config.getOrThrow('APP_CLIENT_ID');
    this.jwtSecret = config.getOrThrow('JWT_SECRET');
  }

  use(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies?.access_token as string;

    if (!token) return next();

    const decoded = jwt.verify(token, this.jwtSecret);
    const payload = decoded as JwtPayloadAuth;

    if (typeof decoded === 'string' || !decoded) {
      throw new UnauthorizedException('Invalid token');
    }

    if (decoded instanceof jwt.TokenExpiredError) {
      res.clearCookie('access_token');
      return next();
    }

    if (payload.clientId !== this.clientId) {
      throw new UnauthorizedException('Token issued for a different client');
    }

    const hasPermission = payload.permissions.some(
      (p) =>
        this.matchPath(p.path, req.path) &&
        p.method === req.method.toUpperCase(),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `No permission for ${req.method} ${req.path}`,
      );
    }

    req.user = payload;
    next();
  }

  private matchPath(pattern: string, actual: string): boolean {
    const regexStr = pattern
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/:[\w]+/g, '[^/]+');

    return new RegExp(`^${regexStr}$`).test(actual);
  }
}
