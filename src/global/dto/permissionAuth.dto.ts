import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class PermissionAuth {
  @IsString()
  @IsNotEmpty()
  path: string;

  @IsEnum(['GET', 'POST', 'DELETE', 'PUT', 'PATCH'])
  @IsNotEmpty()
  method: string;
}
