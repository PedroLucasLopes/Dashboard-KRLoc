import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/global/prisma/prisma.module';
import { AccessoryService } from './service/accessory.service';
import { AccessoryController } from './controller/accessory.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AccessoryController],
  providers: [AccessoryService],
})
export class AccessoryModule {}
