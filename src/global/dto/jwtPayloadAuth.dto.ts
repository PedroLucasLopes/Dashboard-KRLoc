import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';
import { PermissionAuth } from './permissionAuth.dto';

export class JwtPayloadAuth {
  @IsString()
  @IsNotEmpty()
  sub: string;

  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsArray()
  @IsNotEmpty()
  permissions: PermissionAuth[];

  @IsNumber()
  @IsNotEmpty()
  iat: number;

  @IsNumber()
  @IsNotEmpty()
  exp: number;
}
