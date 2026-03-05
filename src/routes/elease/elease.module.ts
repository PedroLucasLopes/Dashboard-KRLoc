import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/global/prisma/prisma.module';
import { ELeaseService } from './service/elease.service';
import { ELeaseController } from './controller/elease.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ELeaseController],
  providers: [ELeaseService],
})
export class ELeaseModule {}
