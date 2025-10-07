import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';
import { IMessagingProvider } from '../interfaces/messaging.interface';

@Injectable()
export class TwilioMessagingProvider implements IMessagingProvider {
  private client: twilio.Twilio;
  private phoneNumber: string;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const phoneNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');

    if (!phoneNumber) {
      throw new InternalServerErrorException(
        'TWILIO_PHONE_NUMBER is not set in environment variables.',
      );
    }

    if (!accountSid || !authToken) {
      throw new InternalServerErrorException(
        'Twilio credentials are not set in environment variables.',
      );
    }

    this.phoneNumber = phoneNumber;

    this.client = twilio(accountSid, authToken);
  }

  async sendMessage(
    to: string,
    body: string,
    variables?: Record<string, string | number>,
  ) {
    await this.client.messages.create({
      from: this.phoneNumber,
      to,
      body,
      contentVariables: variables ? JSON.stringify(variables) : undefined,
    });
  }

  async sendTemplate(
    to: string,
    templateName: string,
    params?: Record<string, string | number>,
  ) {
    await this.client.messages.create({
      contentSid: templateName,
      from: this.phoneNumber,
      to,
      contentVariables: params ? JSON.stringify(params) : undefined,
    });
  }
}
