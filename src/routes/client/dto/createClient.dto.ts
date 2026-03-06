import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsPostalCode,
  IsString,
  IsTaxId,
  Length,
  Matches,
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

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  @IsPostalCode('BR', {
    message: 'Zipcode must be a valid Brazilian postal code',
  })
  @MinLength(8, {
    message: 'Zipcode must be at least 8 characters long',
  })
  zipcode: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  neighborhood?: string;

  @IsString()
  @IsOptional()
  @Length(2, 2)
  @Matches(/^[A-Z]{2}$/, {
    message: 'The state has to be no longer 2 characters',
  })
  state?: string;
}
