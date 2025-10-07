import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { RedisModule } from '@nestjs-modules/ioredis';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotModule } from './bot/bot.module';
import { typeOrmConfig } from './config/typeorm.config';
import { redisConfig } from './config/redis.config';
import { PatientsModule } from './patients/patients.module';
import { PlansModule } from './plans/plans.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { ClinicalRecordsModule } from './clinical-records/clinical-records.module';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty', // Hace los logs legibles en desarrollo
                options: {
                  singleLine: true,
                },
              }
            : undefined, // En producción, usa el formato JSON por defecto
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: redisConfig,
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: typeOrmConfig,
      inject: [ConfigService],
    }),
    BotModule,
    PatientsModule,
    PlansModule,
    SubscriptionsModule,
    ClinicalRecordsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
