import { BaseHandler } from '../base.handler';
import { TWILIO_TEMPLATES } from '../templates';
import {
  Response,
  MessagingInput,
  Context,
  Services,
  BotStates,
} from '../types';

export class MainMenuStartHandler extends BaseHandler {
  state: BotStates = 'START';

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
      nextState: 'WAITING_MENU_OPTION',
      lastInteraction: new Date().toISOString(),
      currentState: this.state,
    };
  }
}
