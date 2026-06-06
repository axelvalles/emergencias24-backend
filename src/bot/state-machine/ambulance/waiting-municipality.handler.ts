import { BaseHandler } from '../base.handler';
import {
  Response,
  MessagingInput,
  Context,
  Services,
  BotStates,
  BOT_STATES,
} from '../types';
import { ServiceType } from 'src/tickets/entities/ticket.entity';
import { MUNICIPALITIES } from 'src/municipality-pricing/constants/municipality-pricing.constants';
import { withNavigationHint } from '../navigation.config';

export class AmbulanceWaitingMunicipalityHandler extends BaseHandler {
  state: BotStates = BOT_STATES.AMBULANCE_WAITING_MUNICIPALITY;

  private readonly municipalities = [...MUNICIPALITIES];
  async handle(
    messagingResponse: MessagingInput,
    _context: Context,
    services: Services,
  ): Promise<Response> {
    const input = messagingResponse.body?.trim();
    const from = messagingResponse.from;

    if (!input) {
      await services.messaging.sendMessage(
        from,
        'Por favor, indica un municipio para continuar.',
      );
      return this.repeatState();
    }

    const number = parseInt(input, 10);

    if (isNaN(number) || number < 1 || number > this.municipalities.length) {
      await services.messaging.sendMessage(
        from,
        `Por favor selecciona una opción válida escribiendo un número del 1 al ${this.municipalities.length}.\n\n${this.buildMunicipalityList()}`,
      );
      return this.repeatState();
    }

    const selectedMunicipality = this.municipalities[number - 1];

    const cost =
      await services.municipalityPricingService.getCostByMunicipality(
        ServiceType.AMBULANCE,
        selectedMunicipality,
      );

    if (cost === null) {
      await services.messaging.sendMessage(
        from,
        `No tengo una tarifa configurada para el municipio *${selectedMunicipality}*. Por favor contacta a un operador para actualizarla.`,
      );
      return this.repeatState();
    }

    await services.messaging.sendMessage(
      from,
      withNavigationHint(
        `Para el municipio *${selectedMunicipality}*, el costo es de ${cost}$.\n¿Deseas solicitar el servicio? Responde "Sí" o "No".`,
      ),
    );

    await services.sessionStore.setMunicipality(from, selectedMunicipality);

    return {
      nextState: 'AMBULANCE_WAITING_CONFIRMATION',
      lastInteraction: new Date().toISOString(),
      currentState: this.state,
    };
  }

  private repeatState(): Response {
    return {
      nextState: this.state,
      lastInteraction: new Date().toISOString(),
      currentState: this.state,
    };
  }

  private buildMunicipalityList(): string {
    return this.municipalities.map((m, i) => `${i + 1}. ${m}`).join('\n');
  }
}
