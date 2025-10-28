import { Priority, ServiceType } from 'src/tickets/entities/ticket.entity';
import { BaseHandler } from '../base.handler';
import {
  Response,
  MessagingInput,
  Context,
  Services,
  BotStates,
} from '../types';

export class MedicalConsultationsConfirmationHandler extends BaseHandler {
  state: BotStates = 'MEDICAL_CONSULTATIONS_CONFIRMATION';

  private readonly specialitiesLabels = {
    general: 'Médicina General',
    odontology: 'Odontología',
    optometry: 'Optometría',
    specialized: 'Medicina Especializada',
  };

  async handle(
    messagingResponse: MessagingInput,
    _context: Context,
    services: Services,
  ): Promise<Response> {
    const { from, body, profileName } = messagingResponse;
    const response = body.toLowerCase().trim();

    if (response === 'no') {
      await services.messaging.sendMessage(
        from,
        'De acuerdo. Si necesitas algo más, no dudes en consultarme.',
      );

      return {
        nextState: 'START',
        lastInteraction: new Date().toISOString(),
        currentState: this.state,
      };
    }

    if (response === 'sí' || response === 'si') {
      await services.ticketsService.create({
        serviceType: ServiceType.MEDICAL_CONSULTATION,
        priority: Priority.HIGH,
        requesterPhone: from,
        requesterName: profileName,
        speciality: _context.speciality,
        description:
          'Solicitud de consulta médica para la especialidad de ' +
          this.specialitiesLabels[String(_context.speciality)],
      });

      await services.messaging.sendMessage(
        from,
        '¡Excelente! Estoy transfiriendo tu solicitud con nuestro personal de control de citas.',
      );

      return {
        nextState: 'START',
        lastInteraction: new Date().toISOString(),
        currentState: this.state,
      };
    }

    await services.messaging.sendMessage(
      from,
      'Por favor, responde con "Sí" o "No".',
    );

    return {
      nextState: this.state,
      lastInteraction: new Date().toISOString(),
      currentState: this.state,
    };
  }
}
