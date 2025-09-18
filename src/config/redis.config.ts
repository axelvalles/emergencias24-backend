import { RedisModuleOptions } from '@nestjs-modules/ioredis';
import { ConfigService } from '@nestjs/config';

export const redisConfig = (
  configService: ConfigService,
): RedisModuleOptions => ({
  type: 'single',
  url: configService.get<string>('REDIS_URL'),
});
