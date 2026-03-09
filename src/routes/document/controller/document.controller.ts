import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Res,
} from '@nestjs/common';
import { DocumentService } from '../service/document.service';
import { Response } from 'express';

@Controller('document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get('generate/:id')
  @HttpCode(HttpStatus.OK)
  async generateContract(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    return await this.documentService.generate(id, res);
  }
}
