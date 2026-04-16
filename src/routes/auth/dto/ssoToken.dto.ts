import { IsJWT, IsNotEmpty, IsString } from 'class-validator';
import { SsoTokenError } from './ssoTokenError.dto';

export class SsoToken extends SsoTokenError {
  @IsJWT()
  @IsNotEmpty()
  access_token!: string;

  @IsString()
  @IsNotEmpty()
  expires_in!: string;
}
