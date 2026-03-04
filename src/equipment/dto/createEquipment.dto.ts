import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { StatusEquipment } from 'generated/prisma/enums';

export class CreateEquipmentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNumber()
  @IsNotEmpty()
  p_diary: number;

  @IsNumber()
  @IsOptional()
  p_weekly?: number;

  @IsNumber()
  @IsOptional()
  p_biweekly?: number;

  @IsNumber()
  @IsOptional()
  p_monthly?: number;

  @IsNumber()
  @IsNotEmpty()
  p_indemnity: number;

  @IsEnum(StatusEquipment)
  @IsNotEmpty()
  status: StatusEquipment = StatusEquipment.AVAILABLE;
}
