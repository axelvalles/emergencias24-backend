import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
// import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  // Permitir datos de Twilio en formato urlencoded
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  // app.useLogger(app.get(Logger));

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((error) => {
  console.error('Error al iniciar la aplicación:', error);
});
