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

export class MedicalConsultationsWaitingOtherHandler extends BaseHandler {
  state: BotStates = BOT_STATES.MEDICAL_CONSULTATIONS_WAITING_OTHER;

  private readonly specialitiesLabels = {
    1: 'Consulta Medicina General',
    2: 'Consulta medica especializada',
    3: 'Medicina Interna',
    4: 'Cardiología',
    5: 'Neumonología',
    6: 'Nefrología',
    7: 'Cirugia General',
    8: 'Dermatologia',
    9: 'Pediatría',
    10: 'Otras...',
  };

  async handle(
    messagingResponse: MessagingInput,
    _context: Context,
    services: Services,
  ): Promise<Response> {
    const response = messagingResponse.body.toLowerCase().trim();

    if (response === '') {
      return this.invalidResponse(
        services,
        messagingResponse,
        'Por favor, escribe la especialidad que necesitas.',
        this.state,
      );
    }

    await services.ticketsService.create({
      serviceType: ServiceType.MEDICAL_CONSULTATION,
      priority: Priority.HIGH,
      requesterPhone: messagingResponse.from,
      requesterName: messagingResponse.profileName,
      speciality: response,
      description:
        'Solicitud de consulta médica para la especialidad de ' + response,
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
