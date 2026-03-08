import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class AddEquipmentsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  equipments: string[];
}
