import { Module } from '@nestjs/common';
import { EquipmentService } from './service/equipment.service';
import { EquipmentController } from './controller/equipment.controller';
import { PrismaModule } from 'src/global/prisma/prisma.module';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  controllers: [EquipmentController],
  providers: [EquipmentService],
})
export class EquipmentModule {}
