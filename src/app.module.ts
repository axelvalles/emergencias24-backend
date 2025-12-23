import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '@nestjs-modules/ioredis';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotModule } from './bot/bot.module';
import { redisConfig, redisFactory } from './config/redis.config';
import { PatientsModule } from './patients/patients.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MessagingModule } from './shared/messaging/messaging.module';
import { TicketsModule } from './tickets/tickets.module';
import { PlansModule } from './plans/plans.module';
import { CompaniesModule } from './companies/companies.module';
import { twilioConfig } from './config/twilio.config';
import { dbConfig, typeOrmFactory } from './config/db.config';
import { envSchema } from './config/configuration';
import { LoggerModule } from 'nestjs-pino';

const isDevelopment = process.env.NODE_ENV !== 'production';

const pinoConfig = {
  pinoHttp: {
    transport: isDevelopment
      ? {
          target: 'pino-pretty',
          options: {
            singleLine: true,
            colorize: true,
          },
        }
      : undefined,
  },
};

@Module({
  imports: [
    LoggerModule.forRoot(pinoConfig),
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
    MessagingModule,
    TicketsModule,
    PlansModule,
    CompaniesModule,
    BotModule,
    PatientsModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
