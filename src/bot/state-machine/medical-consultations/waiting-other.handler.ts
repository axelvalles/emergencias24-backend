import { Priority, ServiceType } from 'src/tickets/entities/ticket.entity';
import { BaseHandler } from '../base.handler';
import {
  Response,
  MessagingInput,
  Context,
  Services,
  BotStates,
} from '../types';

export class MedicalConsultationsWaitingOtherHandler extends BaseHandler {
  state: BotStates = 'MEDICAL_CONSULTATIONS_WAITING_OTHER';

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
      `¡Excelente! Estoy transfiriendo tu solicitud con nuestro personal de control de citas.'`,
    );

    return {
      nextState: 'START',
      lastInteraction: new Date().toISOString(),
      currentState: this.state,
    };
  }
}
