import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Equipment, StatusEquipment } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { validateCode } from '../utils/validateCode.utils';

@Injectable()
export class EquipmentService {
  constructor(private prisma: PrismaService) {}
  async findAll(): Promise<Equipment[]> {
    const equipments: Equipment[] = await this.prisma.equipment.findMany();

    if (equipments.length === 0) {
      throw new NotFoundException('No equipment found');
    }

    return equipments;
  }

  async findById(id: string): Promise<Equipment> {
    const equipment: Equipment | null = await this.prisma.equipment.findUnique({
      where: { id },
    });

    if (!equipment) {
      throw new NotFoundException('This equipment does not exist');
    }

    return equipment;
  }

  async createEquipment(data: Equipment): Promise<Equipment> {
    const code: string = validateCode(data.code);
    const equipmentValidated: Equipment = {
      ...data,
      code,
    };

    if (data.suffix) {
      throw new BadRequestException(
        'The suffix field is not allowed to be filled',
      );
    }

    const equipment: Equipment = await this.prisma.equipment.create({
      data: equipmentValidated,
    });

    return equipment;
  }

  async editEquipment(id: string, data: Equipment): Promise<Equipment> {
    const updateData: Equipment = { ...data };

    if (data.code) {
      updateData.code = validateCode(data.code);
    }

    if (data.suffix) {
      throw new BadRequestException(
        'The suffix field is not allowed to be updated',
      );
    }

    return this.prisma.equipment.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteEquipment(id: string): Promise<void> {
    await this.prisma.equipment.update({
      where: { id },
      data: { status: StatusEquipment.RETIRED },
    });
  }
}
