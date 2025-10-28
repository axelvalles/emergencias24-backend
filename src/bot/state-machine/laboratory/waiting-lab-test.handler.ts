import { Priority, ServiceType } from 'src/tickets/entities/ticket.entity';
import { BaseHandler } from '../base.handler';
import {
  Response,
  MessagingInput,
  Context,
  Services,
  BotStates,
} from '../types';

export class LaboratoryWaitingTestHandler extends BaseHandler {
  state: BotStates = 'LABORATORY_WAITING_TEST';

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
      'Perfecto. En breve le enviaremos los costos de su requerimiento.',
    );

    return {
      nextState: 'START',
      lastInteraction: new Date().toISOString(),
      currentState: this.state,
    };
  }
}
