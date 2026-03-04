import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationDTO } from 'src/global/dto/PaginationDTO.dto';

export class FilterLesseeDTO extends PaginationDTO {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  zipcode: string;

  @IsString()
  @IsOptional()
  city?: string;
}
