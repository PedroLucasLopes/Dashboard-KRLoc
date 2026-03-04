import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsTaxId,
  MinLength,
} from 'class-validator';

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @IsOptional()
  @IsPhoneNumber('BR', {
    message: 'Please enter a valid phone number',
  })
  @MinLength(9, {
    message: 'Phone number must be at least 10 characters long',
  })
  phone?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10, {
    message: 'Tax ID must be at least 11 characters long',
  })
  @IsTaxId('pt-BR', {
    message: 'Please enter a valid tax ID',
  })
  tax_id: string;
}
