import { Priority, ServiceType } from 'src/tickets/entities/ticket.entity';
import { BaseHandler } from '../base.handler';
import {
  Response,
  MessagingInput,
  Context,
  Services,
  BotStates,
} from '../types';

export class AmbulanceWaitingLocationHandler extends BaseHandler {
  state: BotStates = 'AMBULANCE_WAITING_LOCATION';

  async handle(
    messagingResponse: MessagingInput,
    _context: Context,
    services: Services,
  ): Promise<Response> {
    const { from, body, profileName, location } = messagingResponse;

    await services.ticketsService.create({
      serviceType: ServiceType.HOME_CARE,
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
      'Perfecto. Un operador se comunicará contigo para confirmar los detalles.',
    );

    return {
      nextState: 'START',
      lastInteraction: new Date().toISOString(),
      currentState: this.state,
    };
  }
}
