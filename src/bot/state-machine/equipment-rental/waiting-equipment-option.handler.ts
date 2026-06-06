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

export class EquipmentRentalWaitingOptionHandler extends BaseHandler {
  state: BotStates = BOT_STATES.EQUIPMENT_RENTAL_WAITING_OPTION;

  equipmentOptions = {
    '1': 'Kit de bombona de oxígeno',
    '2': 'Concentrador de oxigeno 10lts',
    '3': 'Concentrador de oxigeno 5lts',
    '4': 'Nebulizador',
    '5': 'Sillas de rueda',
    '6': 'Muletas adulto',
    '7': 'Muletas pediatricas',
    '8': 'Colchon antiescaras',
    '9': 'Cama clinica',
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
      serviceType: ServiceType.EQUIPMENT_RENTAL,
      priority: Priority.LOW,
      requesterPhone: from,
      requesterName: profileName,
      description: `Solicitud de alquiler de equipos: ${this.equipmentOptions[selectedItem]}`,
    });

    await services.messaging.sendMessage(
      from,
      'Perfecto. Hemos recibido tu solicitud y en breve te enviaremos los costos del equipo solicitado.',
    );

    return {
      nextState: BOT_STATES.START,
      lastInteraction: new Date().toISOString(),
      currentState: this.state,
    };
  }
}
