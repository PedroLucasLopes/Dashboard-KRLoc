import { Module } from '@nestjs/common';
import { AuthController } from './controller/auth.controller';
import { AuthService } from './service/auth.service';
import { RedisModule } from 'src/global/redis/redis.module';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [RedisModule, ConfigModule, HttpModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
