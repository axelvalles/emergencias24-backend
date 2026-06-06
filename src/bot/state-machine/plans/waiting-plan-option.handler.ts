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

export class PlanWaitingOptionHandler extends BaseHandler {
  state: BotStates = BOT_STATES.PLAN_WAITING_OPTION;

  equipmentOptions = {
    '1': 'Familiar',
    '2': 'Empresarial',
    '3': 'Colectivos',
  };

  async handle(
    messagingResponse: MessagingInput,
    _context: Context,
    services: Services,
  ): Promise<Response> {
    const { from, body, profileName } = messagingResponse;
    const selectedItem = body.trim();

    const validOptions = Object.keys(this.equipmentOptions);

    if (!validOptions.includes(selectedItem)) {
      return this.invalidResponse(
        services,
        messagingResponse,
        'Por favor, elija una opción válida.',
        this.state,
      );
    }

    await services.ticketsService.create({
      serviceType: ServiceType.PLANS,
      priority: Priority.LOW,
      requesterPhone: from,
      requesterName: profileName,
      description: `Solicitud de información sobre el plan: ${this.equipmentOptions[selectedItem]}`,
    });

    await services.messaging.sendMessage(
      from,
      `Perfecto. Hemos recibido tu solicitud y en breve nuestro equipo te contactará para brindarte más información sobre el plan ${this.equipmentOptions[selectedItem]}.`,
    );

    return {
      nextState: BOT_STATES.START,
      lastInteraction: new Date().toISOString(),
      currentState: this.state,
    };
  }
}
