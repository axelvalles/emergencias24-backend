import { TWILIO_MESSSAGES } from '../templates';
import { BaseHandler } from '../base.handler';
import {
  Response,
  MessagingInput,
  Context,
  Services,
  BotStates,
} from '../types';

export class WaitingMenuOptionHandler extends BaseHandler {
  state: BotStates = 'WAITING_MENU_OPTION';

  async handle(
    messagingResponse: MessagingInput,
    _context: Context,
    services: Services,
  ): Promise<Response> {
    switch (messagingResponse.body) {
      case 'atencion-inmediata':
        await services.messaging.sendMessage(
          messagingResponse.from,
          'Para coordinar la ayuda de inmediato, por favor, envíame tu ubicación actual.',
        );

        return {
          nextState: 'IMMEDIATE_ATTENTION_WAITING_LOCATION',
          lastInteraction: new Date().toISOString(),
          currentState: this.state,
        };

      case 'telemedicina':
        await services.messaging.sendMessage(
          messagingResponse.from,
          'Para continuar con la telemedicina, por favor, indícame tu número de Cédula de Identidad.',
        );

        return {
          nextState: 'TELEMEDICINE_WAITING_ID',
          lastInteraction: new Date().toISOString(),
          currentState: this.state,
        };

      case 'atencion-domiciliaria':
        await services.messaging.sendMessage(
          messagingResponse.from,
          TWILIO_MESSSAGES.HOME_CARE_MUNICIPALITIES,
        );

        return {
          nextState: 'HOME_CARE_WAITING_MUNICIPALITY',
          lastInteraction: new Date().toISOString(),
          currentState: this.state,
        };

      case 'consultas-medicas':
        await services.messaging.sendMessage(
          messagingResponse.from,
          TWILIO_MESSSAGES.MEDICAL_CONSULTATIONS_SPECIALITY,
        );

        return {
          nextState: 'MEDICAL_CONSULTATIONS_WAITING_SPECIALTY',
          lastInteraction: new Date().toISOString(),
          currentState: this.state,
        };

      case 'laboratorio':
        await services.messaging.sendMessage(
          messagingResponse.from,
          '¿Que pruebas desea realizar?',
        );

        return {
          nextState: 'LABORATORY_WAITING_TEST',
          lastInteraction: new Date().toISOString(),
          currentState: this.state,
        };

      case 'ambulancia':
        await services.messaging.sendMessage(
          messagingResponse.from,
          TWILIO_MESSSAGES.AMBULANCE_MUNICIPALITIES,
        );

        return {
          nextState: 'AMBULANCE_WAITING_MUNICIPALITY',
          lastInteraction: new Date().toISOString(),
          currentState: this.state,
        };

      case 'farmacia':
        await services.messaging.sendMessage(
          messagingResponse.from,
          'Para contactar a nuestra farmacia, por favor comunícate a través de este enlace: 04227426303',
        );

        return {
          nextState: 'START',
          lastInteraction: new Date().toISOString(),
          currentState: this.state,
        };

      case 'alquiler-de-equipos':
        await services.messaging.sendMessage(
          messagingResponse.from,
          TWILIO_MESSSAGES.EQUIPMENT_RENTAL,
        );

        return {
          nextState: 'EQUIPMENT_RENTAL_WAITING_OPTION',
          lastInteraction: new Date().toISOString(),
          currentState: this.state,
        };

      case 'planes':
        await services.messaging.sendMessage(
          messagingResponse.from,
          TWILIO_MESSSAGES.PLANS,
        );

        return {
          nextState: 'Plan_WAITING_OPTION',
          lastInteraction: new Date().toISOString(),
          currentState: this.state,
        };

      default:
        await services.messaging.sendMessage(
          messagingResponse.from,
          'Opción no válida. Por favor, elige una opción del menú.',
        );

        return {
          nextState: 'WAITING_MENU_OPTION',
          lastInteraction: new Date().toISOString(),
          currentState: this.state,
        };
    }
  }
}
