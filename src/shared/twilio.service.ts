import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';

@Injectable()
export class TwilioService {
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.client = twilio(accountSid, authToken);
  }

  sendMessage(to: string, body: string, variables?: Record<string, string>) {
    return this.client.messages.create({
      from: this.phoneNumber,
      to,
      body,
      contentVariables: variables ? JSON.stringify(variables) : undefined,
    });
  }

  sendTemplate(
    to: string,
    templateId: string,
    variables?: Record<string, string>,
  ) {
    return this.client.messages.create({
      contentSid: templateId,
      from: this.phoneNumber,
      to,
      contentVariables: variables ? JSON.stringify(variables) : undefined,
    });
  }
}
