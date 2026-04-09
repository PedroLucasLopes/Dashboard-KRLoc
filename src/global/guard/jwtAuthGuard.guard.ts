import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { RedisService } from '../redis/service/redis.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly clientId: string;

  constructor(
    private reflector: Reflector,
    private redis: RedisService,
    private config: ConfigService,
  ) {
    this.clientId = config.getOrThrow('APP_CLIENT_ID');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isLogin = this.reflector.getAllAndOverride<boolean>('isLogin', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isLogin) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const sessionId = req.cookies.session_id as string;

    const token = await this.redis.getJwtSession(sessionId);

    const stateFromQuery = req.query?.state as string;

    if (stateFromQuery) {
      const stateFromRedis = await this.redis.getPkceSession(stateFromQuery);

      if (!stateFromRedis)
        throw new UnauthorizedException('Invalid state parameter');

      return true;
    }

    if (!token) {
      throw new UnauthorizedException('Access Denied');
    }

    if (token.exp * 1000 < Date.now()) {
      await this.redis.deleteJwtSession(sessionId);
      res.clearCookie('session_id');
      throw new UnauthorizedException('Session expired');
    }

    if (token.clientId !== this.clientId) {
      throw new UnauthorizedException('Token issued for a different client');
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

    return true;
  }

  private matchPath(pattern: string, actual: string): boolean {
    const regexStr = pattern.replace(/\/api/g, '');
    return new RegExp(`^${regexStr}$`).test(actual);
  }
}
