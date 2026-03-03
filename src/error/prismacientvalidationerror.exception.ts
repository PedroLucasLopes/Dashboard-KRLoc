import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from 'generated/prisma/client';

@Catch(Prisma.PrismaClientValidationError)
export class PrismaExceptionValidationFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientValidationError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const lines = exception.message.split('\n');
    const relevantMessage = lines[lines.length - 1];

    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message: relevantMessage,
    });
  }
}
