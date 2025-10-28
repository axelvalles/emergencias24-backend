import { BaseHandler } from '../base.handler';
import {
  Response,
  MessagingInput,
  Context,
  Services,
  BotStates,
} from '../types';

export class AmbulanceWaitingConfirmationHandler extends BaseHandler {
  state: BotStates = 'AMBULANCE_WAITING_CONFIRMATION';

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
        nextState: 'START',
        lastInteraction: new Date().toISOString(),
        currentState: this.state,
      };
    }

    if (response === 'sí' || response === 'si') {
      await services.messaging.sendMessage(
        messagingResponse.from,
        'Por favor, envíame tu ubicación exacta, para que nuestra unidad llegue de manera inmediata.',
      );

      return {
        nextState: 'AMBULANCE_WAITING_LOCATION',
        lastInteraction: new Date().toISOString(),
        currentState: this.state,
      };
    }

    await services.messaging.sendMessage(
      messagingResponse.from,
      'Por favor, responde con "Sí" o "No".',
    );

    return {
      nextState: this.state,
      lastInteraction: new Date().toISOString(),
      currentState: this.state,
    };
  }
}
