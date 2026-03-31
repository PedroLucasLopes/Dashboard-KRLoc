import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { RedisService } from 'src/global/redis/service/redis.service';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { JwtPayloadAuth } from 'src/global/dto/jwtPayloadAuth.dto';
import crypto from 'node:crypto';

@Injectable()
export class AuthService {
  private jwtSecret: string;

  constructor(
    private config: ConfigService,
    private redis: RedisService,
  ) {
    this.jwtSecret = this.config.getOrThrow('JWT_SECRET');
  }

  async getToken(
    req: Request,
    res: Response,
    code: string,
    state: string,
  ): Promise<void> {
    if (state !== req.query.state)
      throw new UnauthorizedException('State mismatch');

    const { pkce_verifier } =
      ((await this.redis.getPkceSession(state)) as {
        pkce_state: string;
        pkce_verifier: string;
      }) ?? undefined;

    if (!pkce_verifier) throw new UnauthorizedException('Invalid state');

    const sso_token = (await fetch(process.env.SSO_TOKEN_URL ?? '', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        code_verifier: pkce_verifier,
        client_id: process.env.APP_CLIENT_ID,
        redirect_uri: process.env.SSO_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    }).then((r) => r.json())) as {
      access_token?: string;
      token_type?: 'Bearer';
      expires_in?: number;
      message?: string;
      error?: string;
      statusCode?: number;
    };

    if (sso_token && sso_token?.error) {
      throw new BadRequestException(sso_token?.message);
    }

    if (!sso_token || !sso_token.access_token) {
      throw new BadRequestException('Failed to obtain access token from SSO');
    }

    await this.decodeToken(sso_token.access_token, res);
    await this.redis.deletePkceSession(state);
    res.redirect(process.env.APP_BASE_URL ?? '');
  }

  private async decodeToken(token: string, res: Response): Promise<void> {
    const decoded = jwt.verify(token, this.jwtSecret) as JwtPayloadAuth;

    if (typeof decoded === 'string' || !decoded) {
      throw new UnauthorizedException('Invalid token');
    }

    const sessionId = crypto.randomBytes(32).toString('hex');

    res.cookie('session_id', sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: decoded.exp,
    });

    await this.redis.setJwtSession(sessionId, decoded);
  }
}
