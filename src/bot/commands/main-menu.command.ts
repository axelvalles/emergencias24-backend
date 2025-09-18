import { Injectable } from '@nestjs/common';
import { ChatCommand } from '../interfaces/chat-command.interface';
import { TwilioService } from 'src/shared/twilio.service';
import { SessionStoreService } from '../session-store.service';
import { TwilioWebhookDto } from '../dto/twilio-webhook.dto';
import { FlowState, MainMenuOptions } from '../interfaces/flows.enum';
import { BotSession } from '../interfaces/bot-session.interface';

@Injectable()
export class MainMenuCommand implements ChatCommand {
  constructor(
    private readonly twilio: TwilioService,
    private readonly sessionStore: SessionStoreService,
  ) {}

  async execute(payload: TwilioWebhookDto, session: BotSession) {
    switch (payload.Body) {
      case MainMenuOptions.INMEDIATE_ATTENTION:
        await this.twilio.sendMessage(
          payload.From,
          '🚑 ¿Podrías compartir tu ubicación?',
        );
        session.state = FlowState.INMEDIATE_ATTENTION;
        break;
      case MainMenuOptions.TELEMEDICINE:
        await this.twilio.sendMessage(
          payload.From,
          'Porfavor ingresa tu numero de cedula',
        );
        session.state = FlowState.VALIDATE_AFFILIATION;
        break;
      case MainMenuOptions.HOME_CARE:
        await this.twilio.sendMessage(
          payload.From,
          'Porfavor ingresa el municipio donde te encuentras',
        );
        session.state = FlowState.VALIDATE_AFFILIATION;
        break;
      default:
        await this.twilio.sendMessage(payload.From, '❌ Opción no válida.');
        break;
    }
  }
}
