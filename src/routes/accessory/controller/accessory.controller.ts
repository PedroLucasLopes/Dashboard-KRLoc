import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AccessoryService } from '../service/accessory.service';
import { Accessory } from 'generated/prisma/client';

@Controller('accessory')
export class AccessoryController {
  constructor(private readonly accessoryService: AccessoryService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<Accessory[]> {
    return await this.accessoryService.findAll();
  }
}
