import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { APP_FILTER } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './global/prisma/prisma.module';
import { PrismaExceptionFilter } from './global/error/prismaclientknownerror.exception';

import { EquipmentModule } from './routes/equipment/equipment.module';
import { ClientModule } from './routes/client/client.module';
import { LesseeModule } from './routes/lessee/lessee.module';
import { ELeaseModule } from './routes/elease/elease.module';
import { DocumentModule } from './routes/document/document.module';
import { FinantialModule } from './routes/finantial/finantial.module';
import { AccessoryModule } from './routes/accessory/accessory.module';

@Module({
  imports: [
    HttpModule,
    PrismaModule,
    EquipmentModule,
    ConfigModule,
    ClientModule,
    LesseeModule,
    ELeaseModule,
    DocumentModule,
    FinantialModule,
    AccessoryModule,
    SsoClientModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ConfigService,
    { provide: APP_FILTER, useClass: PrismaExceptionFilter },
  ],
})
export class AppModule {}
