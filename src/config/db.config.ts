import { ConfigService, ConfigType, registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const dbConfig = registerAs('database', () => ({
  url:
    process.env.POSTGRES_URL ||
    'postgresql://admin:admin@localhost:5432/app_db',
}));

export const typeOrmFactory = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const dbCfg = configService.get<ConfigType<typeof dbConfig>>('database');
  console.log(dbCfg?.url);

  return {
    type: 'postgres',
    url: dbCfg?.url,
    autoLoadEntities: true,
    synchronize: process.env.NODE_ENV !== 'production',
    entities: [__dirname + '/../**/*.entity.{ts,js}'],
    logging: ['error', 'warn'],
  };
};
