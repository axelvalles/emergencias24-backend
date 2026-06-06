import { WaitingMenuOptionHandler } from './waiting-option.handler';
import { BOT_STATES, type Services } from '../types';

describe('WaitingMenuOptionHandler', () => {
  const handler = new WaitingMenuOptionHandler();

  const services = {
    messaging: {
      sendMessage: jest.fn(),
      sendTemplate: jest.fn(),
    },
    ticketsService: {} as never,
    sessionStore: {} as never,
    patientsService: {} as never,
    municipalityPricingService: {} as never,
  } as unknown as Services;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps the user in the menu on invalid option', async () => {
    const result = await handler.handle(
      {
        from: '584120000000',
        body: 'cualquier-cosa',
        profileName: 'Ana',
        location: null,
      },
      {
        currentState: BOT_STATES.WAITING_MENU_OPTION,
        from: '584120000000',
        lastInteraction: new Date().toISOString(),
        previousState: BOT_STATES.START,
        patient: null,
      },
      services,
    );

    expect(services.messaging.sendMessage).toHaveBeenCalledWith(
      '584120000000',
      'No reconocí esa opción. Por favor, elige una de las opciones del menú principal.',
    );
    expect(result.nextState).toBe(BOT_STATES.WAITING_MENU_OPTION);
  });
});
