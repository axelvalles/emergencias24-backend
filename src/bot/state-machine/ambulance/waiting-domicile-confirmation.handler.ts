import { BaseHandler } from '../base.handler';
import {
  Response,
  MessagingInput,
  Context,
  Services,
  BotStates,
  BOT_STATES,
} from '../types';
import { BOT_MESSAGES, withNavigationHint } from '../navigation.config';

export class AmbulanceWaitingConfirmationHandler extends BaseHandler {
  state: BotStates = BOT_STATES.AMBULANCE_WAITING_CONFIRMATION;

  async handle(
    messagingResponse: MessagingInput,
    _context: Context,
    services: Services,
  ): Promise<Response> {
    const response = messagingResponse.body.toLowerCase().trim();

    if (response === 'no') {
      await services.messaging.sendMessage(
        messagingResponse.from,
        'Entendido. ¿Hay algo más en lo que pueda ayudarte?',
      );

      return {
        nextState: BOT_STATES.START,
        lastInteraction: new Date().toISOString(),
        currentState: this.state,
      };
    }

    if (response === 'sí' || response === 'si') {
      await services.messaging.sendMessage(
        messagingResponse.from,
        withNavigationHint(BOT_MESSAGES.AMBULANCE_LOCATION),
      );

      return {
        nextState: BOT_STATES.AMBULANCE_WAITING_LOCATION,
        lastInteraction: new Date().toISOString(),
        currentState: this.state,
      };
    }

    await services.messaging.sendMessage(
      messagingResponse.from,
      withNavigationHint('Por favor, responde con "Sí" o "No".'),
    );

    return {
      nextState: this.state,
      lastInteraction: new Date().toISOString(),
      currentState: this.state,
    };
  }
}
