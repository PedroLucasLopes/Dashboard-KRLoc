import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { JwtPayloadAuth } from 'src/global/dto/jwtPayloadAuth.dto';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;
  constructor(private config: ConfigService) {}

  onModuleInit() {
    this.redis = new Redis({
      host: this.config.get<string>('REDIS_HOST', 'localhost'),
      port: this.config.get<number>('REDIS_PORT', 6379),
      password: this.config.get<string>('REDIS_PASSWORD'),
    });
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  async setPkceSession(
    state: string,
    data: { pkce_state: string; pkce_verifier: string },
  ): Promise<void> {
    await this.redis.set(`pkce_app:${state}`, JSON.stringify(data), 'EX', 300);
  }

  async getPkceSession(
    state: string,
  ): Promise<{ pkce_state: string; pkce_verifier: string } | null> {
    const raw = (await this.redis.get(`pkce_app:${state}`)) as string;
    if (!raw) return null;
    return JSON.parse(raw) as { pkce_state: string; pkce_verifier: string };
  }

  async deletePkceSession(state: string): Promise<void> {
    await this.redis.del(`pkce_app:${state}`);
  }

  async setJwtSession(token: string, data: JwtPayloadAuth): Promise<void> {
    await this.redis.set(
      `jwt_app:${token}`,
      JSON.stringify(data),
      'EX',
      data.exp,
    );
  }

  async getJwtSession(token: string): Promise<JwtPayloadAuth | null> {
    const raw = (await this.redis.get(`jwt_app:${token}`)) as string;
    if (!raw) return null;
    return JSON.parse(raw) as JwtPayloadAuth;
  }

  async deleteJwtSession(token: string): Promise<void> {
    await this.redis.del(`jwt_app:${token}`);
  }
}
