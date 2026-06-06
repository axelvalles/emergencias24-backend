import { BaseHandler } from '../base.handler';
import {
  Response,
  MessagingInput,
  Context,
  Services,
  BotStates,
  BOT_STATES,
} from '../types';
import { ServiceType, Priority } from 'src/tickets/entities/ticket.entity';

export class ImmediateAttentionWaitingLocationHandler extends BaseHandler {
  state: BotStates = BOT_STATES.IMMEDIATE_ATTENTION_WAITING_LOCATION;

  async handle(
    messagingResponse: MessagingInput,
    _context: Context,
    services: Services,
  ): Promise<Response> {
    const { from, body, profileName, location } = messagingResponse;
    const isValid = location !== null || body.trim() !== '';

    if (!isValid) {
      return this.invalidResponse(
        services,
        messagingResponse,
        'Por favor, escribe o envía una ubicación para poder continuar.',
        this.state,
      );
    }

    await services.ticketsService.create({
      serviceType: ServiceType.IMMEDIATE_ATTENTION,
      priority: Priority.HIGH,
      requesterPhone: from,
      requesterName: profileName,
      location: location
        ? `${location.latitude},${location.longitude}`
        : undefined,
      description: location
        ? `Solicitud de atención inmediata en coordenadas (${location.latitude}, ${location.longitude})`
        : `Solicitud de atención inmediata en la ubicación: ${body.trim()}`,
    });

    await services.messaging.sendMessage(
      from,
      '¡Ubicación recibida! Hemos generado tu solicitud y un operador te contactará de inmediato.',
    );

    return {
      nextState: BOT_STATES.START,
      lastInteraction: this.now(),
      currentState: this.state,
    };
  }
}
