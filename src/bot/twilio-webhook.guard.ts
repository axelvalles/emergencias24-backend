import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

import * as twilio from 'twilio';

@Injectable()
export class TwilioWebhookGuard implements CanActivate {
  private readonly logger = new Logger(TwilioWebhookGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<
      Request & {
        rawBody?: Buffer | string;
      }
    >();

    const signature = request.headers['x-twilio-signature'] as string;

    const authToken = this.configService.getOrThrow<string>('twilio.authToken');

    if (!signature) {
      this.logger.warn('Twilio webhook request missing signature');

      throw new ForbiddenException('Missing Twilio signature');
    }

    const forwardedProto = request
      .get('x-forwarded-proto')
      ?.split(',')[0]
      ?.trim();
    const protocol = forwardedProto || request.protocol;
    const url = `${protocol}://${request.get('host')}${request.originalUrl}`;

    const contentType = request.get('content-type') ?? '';

    const valid = contentType.includes('application/json')
      ? this.validateJsonRequest(authToken, signature, url, request.rawBody)
      : twilio.validateRequest(
          authToken,
          signature,
          url,
          request.body as Record<string, string>,
        );

    if (!valid) {
      this.logger.warn('Twilio webhook signature validation failed');

      throw new ForbiddenException('Invalid Twilio signature');
    }

    return true;
  }

  private validateJsonRequest(
    authToken: string,
    signature: string,
    url: string,
    rawBody?: Buffer | string,
  ): boolean {
    if (!rawBody) {
      this.logger.error('Twilio JSON webhook request missing raw body');

      throw new ForbiddenException('Missing request body');
    }

    const bodyAsString = Buffer.isBuffer(rawBody)
      ? rawBody.toString('utf8')
      : String(rawBody);

    return twilio.validateRequestWithBody(
      authToken,
      signature,
      url,
      bodyAsString,
    );
  }
}
