import { IsNotEmpty, IsString } from 'class-validator';

export class SsoTokenChange {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  code_verifier!: string;

  @IsString()
  @IsNotEmpty()
  client_id!: string;

  @IsString()
  @IsNotEmpty()
  redirect_uri!: string;

  @IsString()
  @IsNotEmpty()
  grant_type!: string;
}
