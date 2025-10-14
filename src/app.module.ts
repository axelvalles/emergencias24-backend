import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '@nestjs-modules/ioredis';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotModule } from './bot/bot.module';
import { redisConfig, redisFactory } from './config/redis.config';
import { PatientsModule } from './patients/patients.module';
import { PlansModule } from './plans/plans.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { ClinicalRecordsModule } from './clinical-records/clinical-records.module';
import twilioConfig from './config/twilio.config';
import { dbConfig, typeOrmFactory } from './config/db.config';
import { envSchema } from './config/configuration';
// import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    // LoggerModule.forRoot({
    //   pinoHttp: {
    //     level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',

    //     transport:
    //       process.env.NODE_ENV !== 'production'
    //         ? {
    //             target: 'pino-pretty',
    //             options: {
    //               colorize: true, // Colores en terminal
    //               singleLine: false, // Multilínea legible
    //               translateTime: 'SYS:HH:MM:ss', // Hora local legible
    //               ignore: 'pid,hostname,context', // Oculta campos poco útiles
    //               messageFormat:
    //                 '{req.method} {req.url} -> {res.statusCode} | {responseTime}ms',
    //             },
    //           }
    //         : undefined, // En producción usa el formato JSON nativo (más rápido)
    //   },
    // }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [twilioConfig, dbConfig, redisConfig],
      validate: (env) => {
        const parsed = envSchema.safeParse(env);
        if (!parsed.success) {
          console.error(
            '❌ Invalid environment variables',
            parsed.error.format(),
          );
          process.exit(1);
        }
        return parsed.data;
      },
    }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: redisFactory,
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: typeOrmFactory,
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
