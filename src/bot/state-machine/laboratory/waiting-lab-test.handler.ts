import { Priority, ServiceType } from 'src/tickets/entities/ticket.entity';
import { BaseHandler } from '../base.handler';
import {
  Response,
  MessagingInput,
  Context,
  Services,
  BotStates,
  BOT_STATES,
} from '../types';

export class LaboratoryWaitingTestHandler extends BaseHandler {
  state: BotStates = BOT_STATES.LABORATORY_WAITING_TEST;

  async handle(
    messagingResponse: MessagingInput,
    _context: Context,
    services: Services,
  ): Promise<Response> {
    const { from, body, profileName } = messagingResponse;

    if (body.trim() === '') {
      return this.invalidResponse(
        services,
        messagingResponse,
        'Por favor, escribe que tipos de exámenes de laboratorio requieres.',
        this.state,
      );
    }

    await services.ticketsService.create({
      serviceType: ServiceType.LABORATORY,
      priority: Priority.LOW,
      requesterPhone: from,
      requesterName: profileName,
      description: `Solicitud de laboratorio: ${body.trim()}`,
    });

    await services.messaging.sendMessage(
      from,
      'Perfecto. Hemos recibido tu solicitud y en breve te enviaremos los costos de los exámenes solicitados.',
    );

    return {
      nextState: BOT_STATES.START,
      lastInteraction: new Date().toISOString(),
      currentState: this.state,
    };
  }
}
