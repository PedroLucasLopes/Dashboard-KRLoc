import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { JwtPayloadAuth } from 'src/global/dto/jwtPayloadAuth.dto';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  constructor(private config: ConfigService) {}
  onModuleInit() {
    this.client = new Redis({
      host: this.config.getOrThrow('REDIS_HOST', 'localhost'),
      port: this.config.getOrThrow('REDIS_PORT', 6379),
      password: this.config.get('REDIS_PASSWORD'),
    });
  }
  async onModuleDestroy() {
    await this.client.quit();
  }

  async setJwtSession(
    access_token: string,
    data: JwtPayloadAuth,
  ): Promise<void> {
    await this.client.set(
      `access_token_app:${access_token}`,
      JSON.stringify(data),
      'EX',
      data.exp,
    );
  }

  async getJwtSession(access_token: string): Promise<JwtPayloadAuth | null> {
    const raw = (await this.client.get(
      `access_token_app:${access_token}`,
    )) as string;
    return (JSON.parse(raw) as JwtPayloadAuth) ?? null;
  }

  async deleteJwtSession(access_token: string): Promise<void> {
    await this.client.del(`access_token_app:${access_token}`);
  }
}
