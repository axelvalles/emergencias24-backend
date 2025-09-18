import { Injectable } from '@nestjs/common';
import { ChatCommand } from '../interfaces/chat-command.interface';
import { TwilioService } from 'src/shared/twilio.service';
import { SessionStoreService } from '../session-store.service';
import { TwilioWebhookDto } from '../dto/twilio-webhook.dto';
import { FlowState } from '../interfaces/flows.enum';
import { BotSession } from '../interfaces/bot-session.interface';

@Injectable()
export class HomeCareCommand implements ChatCommand {
  constructor(
    private readonly sessionStore: SessionStoreService,
    private readonly twilio: TwilioService,
  ) {}

  async execute(payload: TwilioWebhookDto, session: BotSession) {
    console.log(
      `El paciente ${payload.From} requiere atención inmediata, esta es la direccion ${payload.Latitude}, ${payload.Longitude}`,
    );

    await this.twilio.sendMessage(
      payload.From,
      `Un operador se pondra en contacto contigo pronto.`,
    );

    // TODO: avisar a un operador disponible

    session.state = FlowState.WELCOME;
    await this.sessionStore.setSession(payload.From, session);
  }
}
