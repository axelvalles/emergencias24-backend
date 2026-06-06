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
import { withNavigationHint } from '../navigation.config';

export class TelemedicineWaitingIdHandler extends BaseHandler {
  state: BotStates = BOT_STATES.TELEMEDICINE_WAITING_ID;

  async handle(
    messagingResponse: MessagingInput,
    _context: Context,
    services: Services,
  ): Promise<Response> {
    const { from, body, profileName, location } = messagingResponse;
    const ciRegex = /^\d{7,8}$/;
    const isValidCI = ciRegex.test(messagingResponse.body.trim());

    if (!isValidCI) {
      await services.messaging.sendMessage(
        messagingResponse.from,
        withNavigationHint(
          'El número ingresado no parece ser válido. Por favor, ingrésalo nuevamente.',
        ),
      );

      return {
        nextState: this.state,
        lastInteraction: new Date().toISOString(),
        currentState: this.state,
      };
    }

    const patient = await services.patientsService.findByDocument(
      messagingResponse.body.trim(),
    );

    if (!patient) {
      await services.messaging.sendMessage(
        messagingResponse.from,
        'No encontré un registro asociado a esa cédula. Si deseas afiliarte, puedes escribir a analista@emergencias24ve.com.',
      );

      return {
        nextState: BOT_STATES.START,
        lastInteraction: new Date().toISOString(),
        currentState: this.state,
      };
    }

    await services.ticketsService.create(
      {
        serviceType: ServiceType.TELEMEDICINE,
        priority: Priority.HIGH,
        requesterPhone: from,
        requesterName: profileName,
        patientId: patient.id,
        location: location
          ? `${location.latitude},${location.longitude}`
          : undefined,
        description: location
          ? `Solicitud de telemedicina en coordenadas (${location.latitude}, ${location.longitude})`
          : `Solicitud de telemedicina en la ubicación: ${body.trim()}`,
      },
      patient,
    );

    await services.messaging.sendMessage(
      messagingResponse.from,
      `Gracias, ${patient.fullName}. Hemos enviado tu solicitud y un médico de guardia te contactará en breve.`,
    );

    return {
      nextState: BOT_STATES.START,
      lastInteraction: new Date().toISOString(),
      currentState: this.state,
    };
  }
}
