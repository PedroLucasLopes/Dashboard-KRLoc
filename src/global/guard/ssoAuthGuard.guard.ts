import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import * as crypto from 'node:crypto';

@Injectable()
export class SsoAuthGuard implements CanActivate {
  private readonly ssoAuthorizeUrl: string;
  private readonly clientId: string;
  private readonly redirectUri: string;

  constructor(private config: ConfigService) {
    this.ssoAuthorizeUrl = config.getOrThrow('SSO_AUTHORIZE_URL');
    this.clientId = config.getOrThrow('APP_CLIENT_ID');
    this.redirectUri = config.getOrThrow('SSO_REDIRECT_URI');
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    const token = this.extractToken(req);

    if (token) return true;

    if (req.path === '/api/auth/callback') return true;

    this.redirectToSso(req, res);
    return false;
  }

  private extractToken(req: Request): string | undefined {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
    return req.cookies?.access_token as string | undefined;
  }

  private redirectToSso(req: Request, res: Response): void {
    const verifier = crypto.randomBytes(32).toString('base64url');
    const challenge = crypto
      .createHash('sha256')
      .update(verifier)
      .digest('base64url');

    const statePayload = {
      csrf: crypto.randomBytes(16).toString('hex'),
      returnTo: req.originalUrl,
    };
    const state = Buffer.from(JSON.stringify(statePayload)).toString(
      'base64url',
    );

    res.cookie('pkce_verifier', verifier, { httpOnly: true, sameSite: 'lax' });
    res.cookie('pkce_state', state, { httpOnly: true, sameSite: 'lax' });

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
