import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MetaMessagingProvider } from './providers/meta.provider';
import { TwilioMessagingProvider } from './providers/twilio.provider';
import { MessagingService } from './messaging.service';

const messagingProviderFactory = {
  provide: 'MESSAGING_PROVIDER', // Un token de inyección único
  useFactory: (configService: ConfigService) => {
    const provider = configService.get('MESSAGING_PROVIDER');
    switch (provider) {
      case 'meta':
        return new MetaMessagingProvider(configService);
      case 'twilio':
        return new TwilioMessagingProvider(configService);
      default:
        // throw new Error('Proveedor de mensajería no especificado o inválido');
        return new TwilioMessagingProvider(configService);
    }
  },
  inject: [ConfigService],
};

@Module({
  providers: [messagingProviderFactory, MessagingService],
  exports: [MessagingService], // Exportamos el servicio principal para usarlo en otros módulos
})
export class MessagingModule {}
