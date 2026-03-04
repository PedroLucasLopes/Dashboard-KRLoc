import {
  IsISO31661Alpha2,
  IsNotEmpty,
  IsOptional,
  IsPostalCode,
  IsString,
  Min,
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
  @Min(8, {
    message: 'Zipcode must be at least 8 characters long',
  })
  zipcode: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  @IsISO31661Alpha2()
  country?: string;

  @IsString()
  @IsNotEmpty()
  clientId: string;
}
