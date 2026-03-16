import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/global/prisma/prisma.module';
import { FinantialController } from './controller/finantial.controller';
import { FinantialService } from './service/finantial.service';

@Module({
  imports: [PrismaModule],
  controllers: [FinantialController],
  providers: [FinantialService],
})
export class FinantialModule {}
