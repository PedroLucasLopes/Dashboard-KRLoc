import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './global/prisma/prisma.module';
import { PrismaExceptionFilter } from './global/error/prismaclientknownerror.exception';
import { JwtAuthMiddleware } from './global/middleware/jwtAuth.middleware';
import { SsoAuthGuard } from './global/guard/ssoAuthGuard.guard';

import { EquipmentModule } from './routes/equipment/equipment.module';
import { ClientModule } from './routes/client/client.module';
import { LesseeModule } from './routes/lessee/lessee.module';
import { ELeaseModule } from './routes/elease/elease.module';
import { DocumentModule } from './routes/document/document.module';
import { FinantialModule } from './routes/finantial/finantial.module';
import { AccessoryModule } from './routes/accessory/accessory.module';
import { AuthModule } from './routes/auth/auth.module';
import { RedisModule } from './global/redis/redis.module';
@Module({
  imports: [
    HttpModule,
    PrismaModule,
    RedisModule,
    EquipmentModule,
    ConfigModule,
    ClientModule,
    LesseeModule,
    ELeaseModule,
    DocumentModule,
    FinantialModule,
    AccessoryModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ConfigService,
    { provide: APP_FILTER, useClass: PrismaExceptionFilter },
    { provide: APP_GUARD, useClass: SsoAuthGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtAuthMiddleware)
      .forRoutes({ path: '(.*)', method: RequestMethod.ALL });
  }
}
