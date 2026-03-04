import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseFilters,
} from '@nestjs/common';
import { EquipmentService } from '../service/equipment.service';
import { Equipment } from 'generated/prisma/client';
import { PrismaExceptionValidationFilter } from 'src/error/prismacientvalidationerror.exception';
import { CreateEquipmentDto } from '../dto/createEquipment.dto';
import { EditEquipmentDto } from '../dto/editEquipment.dto';
import { PaginationDTO } from 'src/dto/PaginationDTO.dto';

@Controller('/equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get()
  async findAll(@Query() paginationDto: PaginationDTO): Promise<Equipment[]> {
    return await this.equipmentService.findAll(paginationDto);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<Equipment> {
    return await this.equipmentService.findById(id);
  }

  @Post()
  @UseFilters(new PrismaExceptionValidationFilter())
  async createEquipment(
    @Body() createEquipmentDto: CreateEquipmentDto,
  ): Promise<Equipment> {
    return await this.equipmentService.createEquipment(createEquipmentDto);
  }

  @Put(':id')
  async editEquipment(
    @Param('id') id: string,
    @Body() data: EditEquipmentDto,
  ): Promise<Equipment> {
    return await this.equipmentService.editEquipment(id, data);
  }

  @Delete(':id')
  async deleteEquipment(@Param('id') id: string): Promise<void> {
    await this.equipmentService.deleteEquipment(id);
  }
}
