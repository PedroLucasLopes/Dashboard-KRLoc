import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/global/prisma/prisma.module';
import { DocumentService } from './service/document.service';
import { DocumentController } from './controller/document.controller';
import { ELeaseService } from '../elease/service/elease.service';

@Module({
  imports: [PrismaModule],
  controllers: [DocumentController],
  providers: [DocumentService, ELeaseService],
})
export class DocumentModule {}
