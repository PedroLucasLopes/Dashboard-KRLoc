import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { RedisService } from '../redis/service/redis.service';
import { Reflector } from '@nestjs/core';

@Injectable()
export class SsoAuthGuard implements CanActivate {
  private readonly redirectUri: string;

  constructor(
    private reflector: Reflector,
    private config: ConfigService,
    private redis: RedisService,
  ) {
    this.redirectUri = config.getOrThrow('APP_BASE_URL');
  }

  canActivate(context: ExecutionContext): Promise<boolean> | boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const sessionId = req.cookies.session_id as string;

    const isLogin = this.reflector.getAllAndOverride<boolean>('isLogin', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isLogin || !sessionId) return true;

    return this.validateSessionAlreadyExists(sessionId, res);
  }

  private async validateSessionAlreadyExists(
    sessionId: string,
    res: Response,
  ): Promise<boolean> {
    const token = await this.redis.getJwtSession(sessionId);

    if (token && token.exp * 1000 > Date.now()) {
      res.redirect(`${this.redirectUri}/home`);
      return false;
    }

    await this.redis.deleteJwtSession(sessionId);
    res.clearCookie('session_id');
    return true;
  }
}
