import { Injectable, Logger } from '@nestjs/common';
import { CommandRegistry } from './commands/command-registry';
import { TwilioWebhookDto } from './dto/twilio-webhook.dto';
import { SessionStoreService } from './session-store.service';
import { FlowState } from './interfaces/flows.enum';
import { TwilioService } from 'src/shared/twilio.service';

@Injectable()
export class BotService {
  private readonly logger = new Logger(BotService.name);

  constructor(
    private readonly twilio: TwilioService,
    private readonly sessionStore: SessionStoreService,
    private readonly commandRegistry: CommandRegistry,
  ) {}

  async handleMessage(payload: TwilioWebhookDto) {
    const session = await this.sessionStore.getSession(payload.From);

    // await this.sessionStore.clearSession(payload.From);
    // this.logger.log(`Se borro la sesion de ${payload.From}`);
    // return;

    const command = this.commandRegistry.getCommand(session.state);

    this.logger.log(
      `User ${payload.From} - State: ${session.state} - Message: ${payload.Body}`,
    );

    if (command) {
      await command.execute(payload, session);
    } else {
      await this.twilio.sendMessage(
        payload.From,
        'Estamos en mantenimiento por favor intentalo mas tarde',
      );
      session.state = FlowState.WAITING_MAIN_MENU;
    }

    session.lastInteraction = new Date();
    await this.sessionStore.setSession(payload.From, session);
  }
}
