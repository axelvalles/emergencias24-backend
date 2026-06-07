import { WaitingMenuOptionHandler } from './waiting-option.handler';
import { BOT_STATES, type Services } from '../types';
import { ServiceType, Priority } from 'src/tickets/entities/ticket.entity';
import { BOT_MESSAGES } from '../navigation.config';

describe('WaitingMenuOptionHandler', () => {
  const handler = new WaitingMenuOptionHandler();

  const services = {
    messaging: {
      sendMessage: jest.fn(),
      sendTemplate: jest.fn(),
    },
    ticketsService: {
      create: jest.fn(),
    } as never,
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

  it('creates a ticket for study transfer requests', async () => {
    const result = await handler.handle(
      {
        from: '584120000000',
        body: 'realizacion-de-estudios',
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

    expect(services.ticketsService.create).toHaveBeenCalledWith({
      serviceType: ServiceType.STUDY_TRANSFER,
      priority: Priority.LOW,
      requesterPhone: '584120000000',
      requesterName: 'Ana',
      description:
        'Solicitud de traslado para realización de estudios (ida y vuelta) entre entidades de salud. Requiere validación operativa y cotización manual.',
    });
    expect(services.messaging.sendMessage).toHaveBeenCalledWith(
      '584120000000',
      BOT_MESSAGES.STUDY_TRANSFER_CONFIRMATION,
    );
    expect(result.nextState).toBe(BOT_STATES.START);
  });
});
