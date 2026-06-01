import 'reflect-metadata';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import * as qs from 'qs';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
// import { Logger } from 'nestjs-pino';
import type { Request } from 'express';
import { parseCorsOrigins } from './config/cors';

type RawBodyRequest = Request & { rawBody?: Buffer };

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // bufferLogs: true,
  });

  app
    .getHttpAdapter()
    .getInstance()
    .set('query parser', (str: string) => qs.parse(str, { allowDots: true }));

  // Permitir datos de Twilio en formato urlencoded - capture raw body for Twilio signature validation
  app.use(
    bodyParser.urlencoded({
      extended: false,
      verify: (req: RawBodyRequest, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );
  app.use(
    bodyParser.json({
      verify: (req: RawBodyRequest, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  // app.useLogger(app.get(Logger));

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const corsOrigins = parseCorsOrigins(process.env.CORS_ORIGINS);
  console.log(corsOrigins, 'CORS_ORIGINS parsed');
  if (process.env.NODE_ENV === 'production' && corsOrigins.length === 0) {
    throw new Error(
      'CORS_ORIGINS must be set in production environment. No fallback allowed.',
    );
  }
  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : true,
  });

  const port = parseInt(process.env.PORT || '', 10) || 3000;
  console.log(`Application running on http://localhost:${port}`);

  await app.listen(port, '0.0.0.0');
}

bootstrap().catch((error) => {
  console.error('Error al iniciar la aplicación:', error);
});
