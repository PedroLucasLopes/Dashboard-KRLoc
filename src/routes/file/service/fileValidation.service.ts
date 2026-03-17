import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class FileSizeValidationPipe implements PipeTransform {
  transform(value: Express.Multer.File) {
    if (!value) {
      throw new BadRequestException('No file uploaded');
    }

    const fiveMegabyte = 2 * 1024 * 1024;
    if (value.size > fiveMegabyte) {
      throw new BadRequestException('File size exceeds the 2MB limit');
    }

    return value;
  }
}
