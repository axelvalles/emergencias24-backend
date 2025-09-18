import { Injectable } from '@nestjs/common';
import { ChatCommand } from '../interfaces/chat-command.interface';
import { TwilioService } from 'src/shared/twilio.service';
import { SessionStoreService } from '../session-store.service';
import { BotSession } from '../interfaces/bot-session.interface';
import { TwilioWebhookDto } from '../dto/twilio-webhook.dto';
import { FlowState } from '../interfaces/flows.enum';
import { ClientsService } from 'src/clients/clients.service';

@Injectable()
export class ValidateAffiliationCommand implements ChatCommand {
  constructor(
    private readonly twilio: TwilioService,
    private readonly sessionStore: SessionStoreService,
    private readonly clientsService: ClientsService,
  ) {}

  async execute(payload: TwilioWebhookDto, session: BotSession) {
    const message = payload.Body;

    // validar que el mensaje sea un numero de cedula valido
    if (!message.match(/^[0-9]+$/)) {
      await this.twilio.sendMessage(
        payload.From,
        'Porfavor ingresa tu numero de cedula, solo numeros',
      );
      return;
    }

    const client = await this.clientsService.findByDocument(message);

    if (!client) {
      await this.twilio.sendMessage(
        payload.From,
        `Parece que no estas afiliado en el sistema.
        
        Te invitamos acercarte a nuestra sede principal, 
        o puedes enviar un correo a analista@emergencias24ve.com`,
      );

      session.state = FlowState.MAIN_MENU;
      await this.sessionStore.setSession(payload.From, session);

      return;
    }

    await this.twilio.sendMessage(
      payload.From,
      `¡Hola 👋 ${client.firstName}!, nuestros operadores se pondran en contacto contigo pronto!`,
    );

    // TODO: avisar a un operador disponible

    session.state = FlowState.MAIN_MENU;
    session.clientData = client;
    await this.sessionStore.setSession(payload.From, session);
  }
}
