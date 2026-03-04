import { Injectable, NotFoundException } from '@nestjs/common';
import { Equipment, StatusEquipment } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { validateCode } from '../utils/validateCode.utils';
import { CreateEquipmentDto } from '../dto/createEquipment.dto';
import { EditEquipmentDto } from '../dto/editEquipment.dto';
import { PaginationDTO } from 'src/dto/PaginationDTO.dto';
import { PaginationConfig } from 'src/utils/pagination.utils';

@Injectable()
export class EquipmentService {
  constructor(private prisma: PrismaService) {}
  async findAll(paginationDto?: PaginationDTO): Promise<Equipment[]> {
    const { page, limit } = PaginationConfig(paginationDto);
    const equipments: Equipment[] = await this.prisma.equipment.findMany({
      skip: limit,
      take: page,
      orderBy: { suffix: paginationDto?.order },
    });

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

  async createEquipment(data: CreateEquipmentDto): Promise<Equipment> {
    const code: string = validateCode(data.code);
    const equipmentValidated: CreateEquipmentDto = {
      ...data,
      code,
    };

    const equipment: Equipment = await this.prisma.equipment.create({
      data: equipmentValidated,
    });

    return equipment;
  }

  async editEquipment(id: string, data: EditEquipmentDto): Promise<Equipment> {
    const updateData: EditEquipmentDto = { ...data };

    if (data.code) {
      updateData.code = validateCode(data.code);
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
