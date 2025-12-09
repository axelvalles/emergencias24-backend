import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import * as qs from 'qs';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app
    .getHttpAdapter()
    .getInstance()
    .set('query parser', (str: string) => qs.parse(str, { allowDots: true }));

  // Permitir datos de Twilio en formato urlencoded
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  app.useLogger(app.get(Logger));

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.enableCors({
    origin: '*',
  });

  const port = parseInt(process.env.PORT || '', 10) || 8080;
  console.log(port);

  await app.listen(port, '0.0.0.0');
}

bootstrap().catch((error) => {
  console.error('Error al iniciar la aplicación:', error);
});
