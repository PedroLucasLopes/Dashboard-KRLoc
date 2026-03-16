import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { FinantialService } from '../service/finantial.service';

@Controller('finantial')
export class FinantialController {
  constructor(private finantialService: FinantialService) {}

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async equipmentCurrentValue(@Param('id') id: string): Promise<void> {
    return await this.finantialService.equipmentCurrentValue(id);
  }
}
