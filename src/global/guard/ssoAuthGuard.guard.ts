import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import * as crypto from 'node:crypto';
import { RedisService } from '../redis/service/redis.service';

@Injectable()
export class SsoAuthGuard implements CanActivate {
  private readonly ssoAuthorizeUrl: string;
  private readonly clientId: string;
  private readonly redirectUri: string;

  constructor(
    private config: ConfigService,
    private redis: RedisService,
  ) {
    this.ssoAuthorizeUrl = config.getOrThrow('SSO_AUTHORIZE_URL');
    this.clientId = config.getOrThrow('APP_CLIENT_ID');
    this.redirectUri = config.getOrThrow('SSO_REDIRECT_URI');
  }

  canActivate(context: ExecutionContext): Promise<boolean> | boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    if (!req.cookies.session_id) {
      return this.validateAccess(req, res);
    }

    return true;
  }

  private async validateAccess(req: Request, res: Response): Promise<boolean> {
    if (req.path === '/api/auth/callback') return true;

    await this.redirectToSso(req, res);
    return false;
  }

  private async redirectToSso(req: Request, res: Response): Promise<void> {
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

    const url = new URL(this.ssoAuthorizeUrl);
    url.searchParams.set('client_id', this.clientId);
    url.searchParams.set('redirect_uri', this.redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('code_challenge', challenge);
    url.searchParams.set('code_challenge_method', 'S256');
    url.searchParams.set('state', state);

    res.redirect(url.toString());
  }
}
