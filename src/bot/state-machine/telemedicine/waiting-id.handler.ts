import { Priority, ServiceType } from 'src/tickets/entities/ticket.entity';
import { BaseHandler } from '../base.handler';
import {
  Response,
  MessagingInput,
  Context,
  Services,
  BotStates,
} from '../types';

export class TelemedicineWaitingIdHandler extends BaseHandler {
  state: BotStates = 'TELEMEDICINE_WAITING_ID';

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
        'El número ingresado no parece ser válido. Por favor, ingrésalo nuevamente.',
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
        'Parece que no estas registrado. Si quieres afiliarte puedes enviar un correo a analista@emergencias24ve.com',
      );

      return {
        nextState: 'START',
        lastInteraction: new Date().toISOString(),
        currentState: this.state,
      };
    }

    // TODO: Generar alerta a operador en despacho
    await services.ticketsService.create({
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
    });

    await services.messaging.sendMessage(
      messagingResponse.from,
      `Gracias ${patient.fullName}. Hemos enviado tu solicitud. Un médico de guardia te contactará en breve.`,
    );

    return {
      nextState: 'START',
      lastInteraction: new Date().toISOString(),
      currentState: this.state,
    };
  }
}
