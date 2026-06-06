import { BaseHandler } from '../base.handler';
import { TWILIO_TEMPLATES } from '../templates';
import {
  Response,
  MessagingInput,
  Context,
  Services,
  BotStates,
  BOT_STATES,
} from '../types';

export class MainMenuStartHandler extends BaseHandler {
  state: BotStates = BOT_STATES.START;

  async handle(
    messagingResponse: MessagingInput,
    _context: Context,
    services: Services,
  ): Promise<Response> {
    await services.messaging.sendTemplate(
      messagingResponse.from,
      TWILIO_TEMPLATES.MAIN_MENU,
      { name: messagingResponse.profileName || '' },
    );

    return {
      nextState: BOT_STATES.WAITING_MENU_OPTION,
      lastInteraction: new Date().toISOString(),
      currentState: this.state,
    };
  }
}
