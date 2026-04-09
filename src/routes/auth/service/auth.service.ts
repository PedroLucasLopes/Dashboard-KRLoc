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
  private ssoUrl: string;
  private appUrl: string;
  private appClientId: string;

  constructor(
    private config: ConfigService,
    private redis: RedisService,
  ) {
    this.jwtSecret = this.config.getOrThrow('JWT_SECRET');
    this.ssoUrl = this.config.getOrThrow('SSO_BASE_URL');
    this.appUrl = this.config.getOrThrow('APP_BASE_URL');
    this.appClientId = this.config.getOrThrow('APP_CLIENT_ID');
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

    const sso_token = (await fetch(`${this.ssoUrl}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        code_verifier: pkce_verifier,
        client_id: this.appClientId,
        redirect_uri: `${this.appUrl}/auth/callback`,
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
    res.redirect(`${this.appUrl}/home`);
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
