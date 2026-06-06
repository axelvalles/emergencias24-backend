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

export class AmbulanceWaitingLocationHandler extends BaseHandler {
  state: BotStates = BOT_STATES.AMBULANCE_WAITING_LOCATION;

  async handle(
    messagingResponse: MessagingInput,
    _context: Context,
    services: Services,
  ): Promise<Response> {
    const { from, body, profileName, location } = messagingResponse;

    if (location === null && body.trim() === '') {
      return this.invalidResponse(
        services,
        messagingResponse,
        'Por favor, escribe o envía una ubicación para poder continuar.',
        this.state,
      );
    }

    await services.ticketsService.create({
      serviceType: ServiceType.AMBULANCE,
      priority: Priority.MEDIUM,
      requesterPhone: from,
      requesterName: profileName,
      location: location
        ? `${location.latitude},${location.longitude}`
        : undefined,
      municipality: _context.municipality,
      description: location
        ? `Solicitud de traslado, municipio: ${_context.municipality} en coordenadas (${location.latitude}, ${location.longitude})`
        : `Solicitud de traslado, municipio: ${_context.municipality} en la ubicación: ${body.trim()}`,
    });

    await services.messaging.sendMessage(
      messagingResponse.from,
      'Perfecto. Recibí tu ubicación y un operador se comunicará contigo para confirmar los detalles del traslado.',
    );

    return {
      nextState: BOT_STATES.START,
      lastInteraction: new Date().toISOString(),
      currentState: this.state,
    };
  }
}
