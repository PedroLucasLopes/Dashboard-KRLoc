import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class AuthService {
  constructor() {}

  async getToken(
    req: Request,
    res: Response,
    code: string,
    state: string,
  ): Promise<void> {
    if (state !== req.query.state)
      throw new UnauthorizedException('State mismatch');

    const sso_token = (await fetch(process.env.SSO_TOKEN_URL ?? '', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        code_verifier: req.cookies.pkce_verifier as string,
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

    res.cookie('access_token', sso_token.access_token, {
      httpOnly: true,
      sameSite: 'lax',
    });
    res.clearCookie('pkce_verifier');
    res.clearCookie('pkce_state');
    res.redirect(process.env.APP_BASE_URL ?? '');
  }
}
