import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { EquipmentModule } from './equipment/equipment.module';
import { APP_FILTER } from '@nestjs/core';
import { PrismaExceptionFilter } from './error/prismaclientknownerror.exception';

@Module({
  imports: [PrismaModule, EquipmentModule],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: PrismaExceptionFilter },
  ],
})
export class AppModule {}
