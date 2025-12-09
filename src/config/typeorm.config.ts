import { DataSource } from 'typeorm';
import { config } from 'dotenv';
config();

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.POSTGRES_URL,
  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  migrations: [__dirname + '/../database/migrations/*.{js,ts}'],
  synchronize: false,
  migrationsRun: false,
  logging: true,
});

export default AppDataSource;
