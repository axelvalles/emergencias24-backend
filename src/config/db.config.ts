import { ConfigService, ConfigType, registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const dbConfig = registerAs('database', () => ({
  host: process.env.DB_HOST!,
  port: Number(process.env.DB_PORT!),
  username: process.env.DB_USERNAME!,
  password: process.env.DB_PASSWORD!,
  name: process.env.DB_NAME!,
}));

export const typeOrmFactory = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const dbCfg = configService.get<ConfigType<typeof dbConfig>>('database');

  return {
    type: 'postgres',
    host: dbCfg!.host,
    port: dbCfg!.port,
    username: dbCfg!.username,
    password: dbCfg!.password,
    database: dbCfg!.name,
    autoLoadEntities: true,
    synchronize: process.env.NODE_ENV !== 'production',
    entities: [__dirname + '/../**/*.entity.{ts,js}'],
    logging: ['error', 'warn'],
  };
};
