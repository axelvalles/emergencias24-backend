import { BaseHandler } from '../base.handler';
import {
  Response,
  MessagingInput,
  Context,
  Services,
  BotStates,
} from '../types';
import { ServiceType, Priority } from 'src/tickets/entities/ticket.entity';

export class ImmediateAttentionWaitingLocationHandler extends BaseHandler {
  state: BotStates = 'IMMEDIATE_ATTENTION_WAITING_LOCATION';

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
      priority: Priority.URGENT,
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
      '¡Ubicación recibida! Hemos generado un ticket de servicio, un operador le contactará de inmediato.',
    );

    return {
      nextState: 'START',
      lastInteraction: this.now(),
      currentState: this.state as any,
    };
  }
}
