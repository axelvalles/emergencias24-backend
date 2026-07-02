import { TWILIO_MESSSAGES } from '../templates';
import { BaseHandler } from '../base.handler';
import {
  Response,
  MessagingInput,
  Context,
  Services,
  BotStates,
  BOT_STATES,
} from '../types';
import { BOT_MESSAGES, withNavigationHint } from '../navigation.config';
import { Priority, ServiceType } from 'src/tickets/entities/ticket.entity';

export class WaitingMenuOptionHandler extends BaseHandler {
  state: BotStates = BOT_STATES.WAITING_MENU_OPTION;

  async handle(
    messagingResponse: MessagingInput,
    _context: Context,
    services: Services,
  ): Promise<Response> {
    switch (messagingResponse.body) {
      case 'atencion-inmediata':
        await services.messaging.sendMessage(
          messagingResponse.from,
          withNavigationHint(BOT_MESSAGES.IMMEDIATE_ATTENTION_LOCATION),
        );

        return {
          nextState: BOT_STATES.IMMEDIATE_ATTENTION_WAITING_LOCATION,
          lastInteraction: new Date().toISOString(),
          currentState: this.state,
        };

      case 'telemedicina':
        await services.messaging.sendMessage(
          messagingResponse.from,
          withNavigationHint(BOT_MESSAGES.TELEMEDICINE_ID),
        );

        return {
          nextState: BOT_STATES.TELEMEDICINE_WAITING_ID,
          lastInteraction: new Date().toISOString(),
          currentState: this.state,
        };

      case 'atencion-domiciliaria':
        await services.messaging.sendMessage(
          messagingResponse.from,
          withNavigationHint(TWILIO_MESSSAGES.HOME_CARE_MUNICIPALITIES),
        );

        return {
          nextState: BOT_STATES.HOME_CARE_WAITING_MUNICIPALITY,
          lastInteraction: new Date().toISOString(),
          currentState: this.state,
        };

      case 'consultas-medicas':
        await services.messaging.sendMessage(
          messagingResponse.from,
          withNavigationHint(TWILIO_MESSSAGES.MEDICAL_CONSULTATIONS_SPECIALITY),
        );

        return {
          nextState: BOT_STATES.MEDICAL_CONSULTATIONS_WAITING_SPECIALTY,
          lastInteraction: new Date().toISOString(),
          currentState: this.state,
        };

      case 'laboratorio':
        await services.messaging.sendMessage(
          messagingResponse.from,
          withNavigationHint(BOT_MESSAGES.LABORATORY_TESTS),
        );

        return {
          nextState: BOT_STATES.LABORATORY_WAITING_TEST,
          lastInteraction: new Date().toISOString(),
          currentState: this.state,
        };

      case 'ambulancia':
        await services.messaging.sendMessage(
          messagingResponse.from,
          withNavigationHint(TWILIO_MESSSAGES.AMBULANCE_MUNICIPALITIES),
        );

        return {
          nextState: BOT_STATES.AMBULANCE_WAITING_MUNICIPALITY,
          lastInteraction: new Date().toISOString(),
          currentState: this.state,
        };

      case 'realizacion-de-estudios':
        await services.ticketsService.create({
          serviceType: ServiceType.STUDY_TRANSFER,
          priority: Priority.LOW,
          requesterPhone: messagingResponse.from,
          requesterName: messagingResponse.profileName,
          description:
            'Solicitud de traslado para realización de estudios (ida y vuelta) entre entidades de salud. Requiere validación operativa y cotización manual.',
        });

        await services.messaging.sendMessage(
          messagingResponse.from,
          BOT_MESSAGES.STUDY_TRANSFER_CONFIRMATION,
        );

        return {
          nextState: BOT_STATES.START,
          lastInteraction: new Date().toISOString(),
          currentState: this.state,
        };

      case 'farmacia':
        await services.messaging.sendMessage(
          messagingResponse.from,
          'Para contactar a nuestra farmacia, por favor comunícate al 0422-7426303. Ahora te mostraré el menú principal por si necesitas otra gestión.',
        );

        return {
          nextState: BOT_STATES.START,
          lastInteraction: new Date().toISOString(),
          currentState: this.state,
        };

      case 'alquiler-de-equipos':
        await services.messaging.sendMessage(
          messagingResponse.from,
          withNavigationHint(TWILIO_MESSSAGES.EQUIPMENT_RENTAL),
        );

        return {
          nextState: BOT_STATES.EQUIPMENT_RENTAL_WAITING_OPTION,
          lastInteraction: new Date().toISOString(),
          currentState: this.state,
        };

      case 'planes':
        await services.messaging.sendMessage(
          messagingResponse.from,
          withNavigationHint(TWILIO_MESSSAGES.PLANS),
        );

        return {
          nextState: BOT_STATES.PLAN_WAITING_OPTION,
          lastInteraction: new Date().toISOString(),
          currentState: this.state,
        };

      default:
        await services.messaging.sendMessage(
          messagingResponse.from,
          'No reconocí esa opción. Por favor, elige una de las opciones del menú principal.',
        );

        return {
          nextState: BOT_STATES.WAITING_MENU_OPTION,
          lastInteraction: new Date().toISOString(),
          currentState: this.state,
        };
    }
  }
}
