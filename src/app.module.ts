import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { APP_FILTER } from '@nestjs/core';

import { PrismaModule } from './global/prisma/prisma.module';
import { PrismaExceptionFilter } from './global/error/prismaclientknownerror.exception';

import { EquipmentModule } from './routes/equipment/equipment.module';
import { ClientModule } from './routes/client/client.module';
import { LesseeModule } from './routes/lessee/lessee.module';
import { ELeaseModule } from './routes/elease/elease.module';
import { HttpModule } from '@nestjs/axios';
import { DocumentModule } from './routes/document/document.module';

@Module({
  imports: [
    HttpModule,
    PrismaModule,
    EquipmentModule,
    ClientModule,
    LesseeModule,
    ELeaseModule,
    DocumentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: PrismaExceptionFilter },
  ],
})
export class AppModule {}
