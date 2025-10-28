import { RedisModuleOptions } from '@nestjs-modules/ioredis';
import { ConfigService, ConfigType, registerAs } from '@nestjs/config';

export const redisConfig = registerAs('redis', () => ({
  url: String(process.env.REDIS_URL),
}));

export const redisFactory = (
  configService: ConfigService,
): RedisModuleOptions => {
  const redisCfg = configService.get<ConfigType<typeof redisConfig>>('redis');

  return {
    type: 'single',
    url: redisCfg!.url,
  };
};
