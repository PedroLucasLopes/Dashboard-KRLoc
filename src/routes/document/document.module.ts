import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/global/prisma/prisma.module';
import { DocumentService } from './service/document.service';
import { DocumentController } from './controller/document.controller';
import { ELeaseService } from '../elease/service/elease.service';
import { FileService } from './service/file.service';

@Module({
  imports: [PrismaModule],
  controllers: [DocumentController],
  providers: [DocumentService, ELeaseService, FileService],
})
export class DocumentModule {}
