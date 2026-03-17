import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { FileSizeValidationPipe } from './service/fileValidation.service';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  providers: [FileSizeValidationPipe],
  exports: [FileSizeValidationPipe],
})
export class FileModule {}
