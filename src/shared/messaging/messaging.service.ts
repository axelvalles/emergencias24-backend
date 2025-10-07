// src/messaging/messaging.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { IMessagingProvider } from './interfaces/messaging.interface';

@Injectable()
export class MessagingService {
  constructor(
    @Inject('MESSAGING_PROVIDER') // Inyectamos el proveedor que la fábrica nos dio
    private readonly messagingProvider: IMessagingProvider,
  ) {}

  async sendMessage(to: string, message: string) {
    return this.messagingProvider.sendMessage(to, message);
  }

  async sendTemplate(
    to: string,
    templateName: string,
    params?: Record<string, string | number>,
  ) {
    return this.messagingProvider.sendTemplate(to, templateName, params);
  }
}
