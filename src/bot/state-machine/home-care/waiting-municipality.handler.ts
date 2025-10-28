import { BaseHandler } from '../base.handler';
import {
  Response,
  MessagingInput,
  Context,
  Services,
  BotStates,
} from '../types';

export class HomeCareWaitingMunicipalityHandler extends BaseHandler {
  state: BotStates = 'HOME_CARE_WAITING_MUNICIPALITY';

  private readonly municipalities = [
    'Mariño',
    'Maneiro',
    'García',
    'Arismendi',
    'Antolín',
    'Gómez',
    'Marcano',
    'Díaz',
    'Tubores',
    'P. Macanao',
  ];

  private readonly municipalityCosts = {
    urban: {
      municipalities: ['Mariño', 'Maneiro', 'García', 'Arismendi'],
      cost: 55,
    },
    suburban: {
      municipalities: ['Antolín', 'Gómez', 'Marcano', 'Díaz'],
      cost: 65,
    },
    extraurban: {
      municipalities: ['Tubores', 'P. Macanao'],
      cost: 80,
    },
  };

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

    const cost = this.getMunicipalityCost(selectedMunicipality);

    await services.messaging.sendMessage(
      from,
      `Para el municipio *${selectedMunicipality}*, el costo es de ${cost}$.\n¿Deseas solicitar el servicio? (Sí/No)`,
    );

    await services.sessionStore.setMunicipality(from, selectedMunicipality);

    return {
      nextState: 'HOME_CARE_WAITING_DOMICILE_CONFIRMATION',
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

  private getMunicipalityCost(municipality: string): number | null {
    const group = Object.values(this.municipalityCosts).find((g) =>
      g.municipalities.some(
        (m) => m.toLowerCase() === municipality.toLowerCase(),
      ),
    );
    return group ? group.cost : null;
  }
}
