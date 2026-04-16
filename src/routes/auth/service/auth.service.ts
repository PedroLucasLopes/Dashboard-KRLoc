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
import * as crypto from 'node:crypto';
import { HttpService } from '@nestjs/axios';
import { SsoToken } from '../dto/ssoToken.dto';
import { SsoTokenChange } from '../dto/ssoTokenChange.dto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  private jwtSecret: string;
  private ssoUrl: string;
  private appUrl: string;
  private appClientId: string;

  constructor(
    private config: ConfigService,
    private redis: RedisService,
    private httpService: HttpService,
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
    const pkceSession = (await this.redis.getPkceSession(state)) as {
      pkce_state: string;
      pkce_verifier: string;
    } | null;

    if (!pkceSession?.pkce_verifier)
      throw new UnauthorizedException('Invalid state');

    const { data } = await firstValueFrom(
      this.httpService.post<SsoToken>(
        `${this.ssoUrl}/token`,
        {
          code,
          code_verifier: pkceSession.pkce_verifier,
          client_id: this.appClientId,
          redirect_uri: `${this.appUrl}/auth/callback`,
          grant_type: 'authorization_code',
        } as SsoTokenChange,
        {
          validateStatus: () => true,
        },
      ),
    );

    if (data.error) {
      throw new BadRequestException(`${data.message}`);
    }

    if (!data || !data.access_token) {
      throw new BadRequestException('Failed to obtain access token from SSO');
    }

    await this.decodeToken(data.access_token, res);
    await this.redis.deletePkceSession(state);
    res.redirect(`${this.appUrl}/home`);
  }

  async redirectToSso(req: Request, res: Response): Promise<void> {
    const verifier = crypto.randomBytes(32).toString('base64url');
    const challenge = crypto
      .createHash('sha256')
      .update(verifier)
      .digest('base64url');

    const statePayload = {
      csrf: crypto.randomBytes(16).toString('hex'),
    };
    const state = Buffer.from(JSON.stringify(statePayload)).toString(
      'base64url',
    );

    await this.redis.setPkceSession(state, {
      pkce_state: state,
      pkce_verifier: verifier,
    });

    const url = new URL(`${this.ssoUrl}/authorize`);
    url.searchParams.set('client_id', this.appClientId);
    url.searchParams.set('redirect_uri', `${this.appUrl}/auth/callback`);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('code_challenge', challenge);
    url.searchParams.set('code_challenge_method', 'S256');
    url.searchParams.set('state', state);

    res.redirect(url.toString());
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
      maxAge: decoded.exp * 1000 - Date.now(),
    });

    await this.redis.setJwtSession(sessionId, decoded);
  }
}
