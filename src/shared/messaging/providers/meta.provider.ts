// src/shared/providers/meta-messaging.provider.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { IMessagingProvider } from '../interfaces/messaging.interface';
import { Logger } from '@nestjs/common';
import { MetaResponse } from '../interfaces/meta-response';

@Injectable()
export class MetaMessagingProvider implements IMessagingProvider {
  private readonly logger = new Logger(MetaMessagingProvider.name);
  private readonly apiUrl: string;
  private readonly accessToken: string;
  private readonly phoneNumberId: string;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = 'https://graph.facebook.com/v23.0'; // usa la versión estable que tengas
    this.accessToken =
      this.configService.get<string>('META_ACCESS_TOKEN') || '';
    this.phoneNumberId =
      this.configService.get<string>('META_PHONE_NUMBER_ID') || '';
  }

  async sendMessage(to: string, message: string) {
    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: message },
    };

    await this.callMetaApi(payload);
  }

  async sendTemplate(
    to: string,
    templateName: string,
    params?: Record<string, string | number>,
  ) {
    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'es' },
        components: [
          {
            type: 'body',
            parameters: params
              ? Object.values(params).map((value) => ({
                  type: 'text',
                  text: String(value),
                }))
              : [],
          },
        ],
      },
    };

    await this.callMetaApi(payload);
  }

  private async callMetaApi(payload: any) {
    try {
      const response = await axios.post<MetaResponse>(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `❌ Error enviando mensaje con Meta al destinatario: ${payload.to}`,
        error.response?.data || error.message,
      );
      throw error;
    }
  }
}
