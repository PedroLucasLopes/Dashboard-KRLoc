import { Module } from '@nestjs/common';
import { EquipmentService } from './service/equipment.service';
import { EquipmentController } from './controller/equipment.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EquipmentController],
  providers: [EquipmentService],
})
export class EquipmentModule {}
