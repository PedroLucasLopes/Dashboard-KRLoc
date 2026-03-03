import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseFilters,
} from '@nestjs/common';
import { EquipmentService } from '../service/equipment.service';
import { Equipment } from 'generated/prisma/client';
import { PrismaExceptionValidationFilter } from 'src/error/prismacientvalidationerror.exception';

@Controller('/equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get()
  async findAll(): Promise<Equipment[]> {
    return await this.equipmentService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<Equipment> {
    return await this.equipmentService.findById(id);
  }

  @Post()
  @UseFilters(new PrismaExceptionValidationFilter())
  async createEquipment(@Body() data: Equipment): Promise<Equipment> {
    return await this.equipmentService.createEquipment(data);
  }

  @Put(':id')
  async editEquipment(
    @Param('id') id: string,
    @Body() data: Equipment,
  ): Promise<Equipment> {
    return await this.equipmentService.editEquipment(id, data);
  }

  @Delete(':id')
  async deleteEquipment(@Param('id') id: string): Promise<void> {
    await this.equipmentService.deleteEquipment(id);
  }
}
