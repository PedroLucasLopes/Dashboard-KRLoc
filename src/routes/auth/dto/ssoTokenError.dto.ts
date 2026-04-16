import { IsOptional, IsString } from 'class-validator';

export class SsoTokenError {
  @IsString()
  @IsOptional()
  error?: string;

  @IsString()
  @IsOptional()
  message?: string;
}
