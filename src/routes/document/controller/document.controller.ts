import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Param,
  Res,
} from '@nestjs/common';
import { DocumentService } from '../service/document.service';
import { Response } from 'express';
import { FinantialReportDto } from '../dto/finantialReport.dto';

@Controller('generate')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post('contract/:id')
  @HttpCode(HttpStatus.OK)
  async generateContract(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    return await this.documentService.generateContract(id, res);
  }

  @Post('finantial/:id')
  @HttpCode(HttpStatus.OK)
  async generateFinantialClose(
    @Param('id') id: string,
    @Res() res: Response,
    @Body() body: FinantialReportDto,
  ): Promise<void> {
    return await this.documentService.generateFinantialReport(id, res, body);
  }

  @Post('closure/:id')
  @HttpCode(HttpStatus.OK)
  async generateContractClosure(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    return await this.documentService.generateContractClosure(id, res);
  }
}
