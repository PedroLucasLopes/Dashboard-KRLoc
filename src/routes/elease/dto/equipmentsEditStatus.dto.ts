import { IsArray, IsIn, IsNotEmpty, IsString } from 'class-validator';
import { StatusEquipment } from 'generated/prisma/enums';

class EquipmentStatusDto {
  @IsString()
  id: string;

  @IsIn([
    StatusEquipment.AVAILABLE,
    StatusEquipment.STOLEN,
    StatusEquipment.MAINTENANCE,
  ])
  status: StatusEquipment;
}

export class EquipmentsEditStatus {
  @IsArray()
  @IsNotEmpty()
  equipments: EquipmentStatusDto[];
}
