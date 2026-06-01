import { ConfigService, ConfigType, registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const dbConfig = registerAs('database', () => {
  const url = process.env.POSTGRES_URL;

  if (process.env.NODE_ENV === 'production' && !url) {
    throw new Error(
      'POSTGRES_URL environment variable is required in production',
    );
  }

  return {
    url: url || 'postgresql://admin:admin@localhost:5432/app_db',
  };
});

export const typeOrmFactory = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const dbCfg = configService.get<ConfigType<typeof dbConfig>>('database');

  return {
    type: 'postgres',
    url: dbCfg?.url,
    autoLoadEntities: true,
    synchronize: process.env.NODE_ENV !== 'production',
    entities: [__dirname + '/../**/*.entity.{ts,js}'],
    logging: ['error', 'warn'],
  };
};
