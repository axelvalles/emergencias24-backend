import { RedisModuleOptions } from '@nestjs-modules/ioredis';
import { ConfigService, ConfigType, registerAs } from '@nestjs/config';

export const redisConfig = registerAs('redis', () => {
  const url = process.env.REDIS_URL;

  if (process.env.NODE_ENV === 'production' && !url) {
    throw new Error('REDIS_URL environment variable is required in production');
  }

  return {
    url: String(url || 'redis://localhost:6379'),
  };
});

export const redisFactory = (
  configService: ConfigService,
): RedisModuleOptions => {
  const redisCfg = configService.get<ConfigType<typeof redisConfig>>('redis');

  return {
    type: 'single',
    url: redisCfg!.url,
  };
};
