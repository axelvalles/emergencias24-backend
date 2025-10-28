import { BaseHandler } from '../base.handler';
import {
  Response,
  MessagingInput,
  Context,
  Services,
  BotStates,
} from '../types';

export class MedicalConsultationsWaitingSpecialityHandler extends BaseHandler {
  state: BotStates = 'MEDICAL_CONSULTATIONS_WAITING_SPECIALTY';

  private readonly specialitiesCost = {
    general: 10000,
    odontology: 15000,
    optometry: 20000,
    specialized: 25000,
  };

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
    const selectedItemId = messagingResponse.body;

    if (
      selectedItemId === 'general' ||
      selectedItemId === 'odontology' ||
      selectedItemId === 'optometry'
    ) {
      await services.sessionStore.setSpeciality(
        messagingResponse.from,
        selectedItemId,
      );

      await services.messaging.sendMessage(
        messagingResponse.from,
        `Las consultas de ${this.specialitiesLabels[selectedItemId]} tienen un costo de ${this.specialitiesCost[selectedItemId]}. ¿Deseas agendar una cita? (Sí/No)`,
      );

      return {
        nextState: 'MEDICAL_CONSULTATIONS_CONFIRMATION',
        lastInteraction: new Date().toISOString(),
        currentState: this.state,
      };
    }

    if (selectedItemId === 'specialized') {
      await services.sessionStore.setSpeciality(
        messagingResponse.from,
        selectedItemId,
      );

      await services.messaging.sendMessage(
        messagingResponse.from,
        `Las consultas de ${this.specialitiesLabels[selectedItemId]} tienen un costo de ${this.specialitiesCost[selectedItemId]}. ¿Deseas agendar una cita? (Sí/No)`,
      );

      return {
        nextState: 'MEDICAL_CONSULTATIONS_CONFIRMATION',
        lastInteraction: new Date().toISOString(),
        currentState: this.state,
      };
    }

    await services.messaging.sendMessage(
      messagingResponse.from,
      'Opción no válida. Por favor, elige una opción del menú.',
    );

    return {
      nextState: this.state,
      lastInteraction: new Date().toISOString(),
      currentState: this.state,
    };
  }
}
