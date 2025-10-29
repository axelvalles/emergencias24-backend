import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, `../../.env.production.local`) });

export default new DataSource({
  type: 'postgres',
  url: process.env.POSTGRES_URL,
  entities: [path.resolve(__dirname, '../src/**/*.entity.{ts,js}')],
  migrations: [path.resolve(__dirname, '../src/migrations/*.{ts,js}')],
  synchronize: false,
  logging: true,
});
