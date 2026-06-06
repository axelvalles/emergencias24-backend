import { BaseHandler } from '../base.handler';
import {
  Response,
  MessagingInput,
  Context,
  Services,
  BotStates,
  BOT_STATES,
} from '../types';
import { Priority, ServiceType } from 'src/tickets/entities/ticket.entity';
import { withNavigationHint } from '../navigation.config';

export class MedicalConsultationsWaitingSpecialityHandler extends BaseHandler {
  state: BotStates = BOT_STATES.MEDICAL_CONSULTATIONS_WAITING_SPECIALTY;

  private readonly specialitiesLabels = {
    '1': 'Consulta Medicina General',
    '2': 'Consulta medica especializada',
    '3': 'Medicina Interna',
    '4': 'Cardiología',
    '5': 'Neumonología',
    '6': 'Nefrología',
    '7': 'Cirugia General',
    '8': 'Dermatologia',
    '9': 'Pediatría',
    '10': 'Otras...',
  };

  async handle(
    messagingResponse: MessagingInput,
    _context: Context,
    services: Services,
  ): Promise<Response> {
    const selectedItemId = messagingResponse.body;

    const validOptions = Object.keys(this.specialitiesLabels); // ['1','2','3',...,'10']

    if (!validOptions.includes(selectedItemId)) {
      await services.messaging.sendMessage(
        messagingResponse.from,
        withNavigationHint(
          'Opción no válida. Por favor, elige una opción del menú.',
        ),
      );

      return {
        nextState: this.state,
        lastInteraction: new Date().toISOString(),
        currentState: this.state,
      };
    }

    if (selectedItemId === '10') {
      await services.messaging.sendMessage(
        messagingResponse.from,
        withNavigationHint('Escribe la especialidad que necesitas.'),
      );

      return {
        nextState: BOT_STATES.MEDICAL_CONSULTATIONS_WAITING_OTHER,
        lastInteraction: new Date().toISOString(),
        currentState: this.state,
      };
    }

    await services.ticketsService.create({
      serviceType: ServiceType.MEDICAL_CONSULTATION,
      priority: Priority.HIGH,
      requesterPhone: messagingResponse.from,
      requesterName: messagingResponse.profileName,
      speciality: selectedItemId,
      description:
        'Solicitud de consulta médica para la especialidad de ' +
        this.specialitiesLabels[selectedItemId],
    });

    await services.messaging.sendMessage(
      messagingResponse.from,
      'Excelente. Hemos enviado tu solicitud y nuestro personal de control de citas continuará el proceso contigo.',
    );

    return {
      nextState: BOT_STATES.START,
      lastInteraction: new Date().toISOString(),
      currentState: this.state,
    };
  }
}
