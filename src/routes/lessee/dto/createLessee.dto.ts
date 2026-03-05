import {
  IsNotEmpty,
  IsOptional,
  IsPostalCode,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateLesseeDTO {
  @IsString()
  @IsNotEmpty()
  name: string;

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

  @IsString()
  @IsNotEmpty()
  clientId: string;
}
