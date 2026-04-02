import {
  ForbiddenException,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Response, Request } from 'express';
import { RedisService } from '../redis/service/redis.service';

@Injectable()
export class JwtAuthMiddleware implements NestMiddleware {
  private readonly clientId: string;

  constructor(
    private config: ConfigService,
    private redis: RedisService,
  ) {
    this.clientId = config.getOrThrow('APP_CLIENT_ID');
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const token = await this.redis.getJwtSession(
      req.cookies.session_id as string,
    );

    const noValidSession = !token || !req.cookies.session_id;
    const tokenExpired = token && token.exp * 1000 < Date.now();

    if (tokenExpired || noValidSession) {
      await this.redis.deleteJwtSession(req.cookies.session_id as string);
      res.clearCookie('session_id');
      return next();
    }

    if (token.clientId !== this.clientId) {
      throw new UnauthorizedException('Token issued for a different client');
    }

    if (token && req.path === '/api/auth/logout') {
      await this.redis.deleteJwtSession(req.cookies.session_id as string);
      res.clearCookie('session_id');
      res.redirect('/api/login');
    }

    const hasPermission = token.permissions.some(
      (p) =>
        this.matchPath(req.path, p.path) &&
        p.method === req.method.toUpperCase(),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `No permission for ${req.method} ${req.path}`,
      );
    }

    next();
  }

  private matchPath(pattern: string, actual: string): boolean {
    const regexStr = pattern.replace(/\/api/g, '');

    return new RegExp(`^${regexStr}$`).test(actual);
  }
}
