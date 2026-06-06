import { Test, TestingModule } from '@nestjs/testing';
import { BotService } from './bot.service';
import { MessagingService } from '../shared/messaging/messaging.service';
import { SessionStoreService } from './session-store.service';
import { PatientsService } from '../patients/patients.service';
import { TicketsService } from '../tickets/tickets.service';
import { MunicipalityPricingService } from '../municipality-pricing/municipality-pricing.service';
import { BOT_STATES } from './state-machine/types';

describe('BotService', () => {
  let service: BotService;

  const messagingMock = {
    sendMessage: jest.fn(),
    sendTemplate: jest.fn(),
  };

  const sessionStoreMock = {
    getSession: jest.fn(),
    setSession: jest.fn(),
    setCurentState: jest.fn(),
  };

  const patientsServiceMock = {
    findByDocument: jest.fn(),
  };

  const ticketsServiceMock = {
    create: jest.fn(),
  };

  const municipalityPricingServiceMock = {
    getCostByMunicipality: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BotService,
        { provide: MessagingService, useValue: messagingMock },
        { provide: SessionStoreService, useValue: sessionStoreMock },
        { provide: PatientsService, useValue: patientsServiceMock },
        { provide: TicketsService, useValue: ticketsServiceMock },
        {
          provide: MunicipalityPricingService,
          useValue: municipalityPricingServiceMock,
        },
      ],
    }).compile();

    service = module.get<BotService>(BotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('shows the previous prompt when the user writes volver', async () => {
    sessionStoreMock.getSession.mockResolvedValue({
      currentState: BOT_STATES.HOME_CARE_WAITING_LOCATION,
      from: '584120000000',
      lastInteraction: new Date().toISOString(),
      previousState: BOT_STATES.HOME_CARE_WAITING_DOMICILE_CONFIRMATION,
      patient: null,
      municipality: 'Mariño',
    });

    await service.handleMessage({
      from: '584120000000',
      body: 'volver',
      profileName: 'Ana',
      location: null,
      mediaUrl: null,
      mediaContentType: null,
      interactiveReplyId: null,
    });

    expect(messagingMock.sendMessage).toHaveBeenCalledWith(
      '584120000000',
      expect.stringContaining('¿Deseas solicitar el servicio?'),
    );

    expect(sessionStoreMock.setSession).toHaveBeenCalledWith(
      '584120000000',
      expect.objectContaining({
        currentState: BOT_STATES.HOME_CARE_WAITING_DOMICILE_CONFIRMATION,
        previousState: BOT_STATES.HOME_CARE_WAITING_LOCATION,
      }),
    );
  });

  it('returns to the main menu after completing a flow', async () => {
    sessionStoreMock.getSession.mockResolvedValue({
      currentState: BOT_STATES.IMMEDIATE_ATTENTION_WAITING_LOCATION,
      from: '584120000000',
      lastInteraction: new Date().toISOString(),
      previousState: BOT_STATES.WAITING_MENU_OPTION,
      patient: null,
    });

    ticketsServiceMock.create.mockResolvedValue(undefined);

    await service.handleMessage({
      from: '584120000000',
      body: 'Av. 4 de Mayo',
      profileName: 'Ana',
      location: null,
      mediaUrl: null,
      mediaContentType: null,
      interactiveReplyId: null,
    });

    expect(messagingMock.sendMessage).toHaveBeenCalledWith(
      '584120000000',
      expect.stringContaining('¡Ubicación recibida!'),
    );
    expect(messagingMock.sendMessage).toHaveBeenCalledWith(
      '584120000000',
      expect.stringContaining('Ahora te mostraré el menú principal'),
    );
    expect(messagingMock.sendTemplate).toHaveBeenCalledWith(
      '584120000000',
      expect.any(String),
      { name: 'Ana' },
    );
    expect(sessionStoreMock.setSession).toHaveBeenCalledWith(
      '584120000000',
      expect.objectContaining({
        currentState: BOT_STATES.WAITING_MENU_OPTION,
        previousState: BOT_STATES.IMMEDIATE_ATTENTION_WAITING_LOCATION,
      }),
    );
  });

  it('cancels the current flow and returns to the menu', async () => {
    sessionStoreMock.getSession.mockResolvedValue({
      currentState: BOT_STATES.TELEMEDICINE_WAITING_ID,
      from: '584120000000',
      lastInteraction: new Date().toISOString(),
      previousState: BOT_STATES.WAITING_MENU_OPTION,
      patient: null,
    });

    await service.handleMessage({
      from: '584120000000',
      body: 'cancelar',
      profileName: 'Ana',
      location: null,
      mediaUrl: null,
      mediaContentType: null,
      interactiveReplyId: null,
    });

    expect(messagingMock.sendMessage).toHaveBeenCalledWith(
      '584120000000',
      expect.stringContaining('He cancelado el proceso actual'),
    );
    expect(messagingMock.sendTemplate).toHaveBeenCalledWith(
      '584120000000',
      expect.any(String),
      { name: 'Ana' },
    );
    expect(sessionStoreMock.setSession).toHaveBeenCalledWith(
      '584120000000',
      expect.objectContaining({
        currentState: BOT_STATES.WAITING_MENU_OPTION,
        previousState: BOT_STATES.TELEMEDICINE_WAITING_ID,
      }),
    );
  });

  it('shows the main menu when the user writes menu', async () => {
    sessionStoreMock.getSession.mockResolvedValue({
      currentState: BOT_STATES.TELEMEDICINE_WAITING_ID,
      from: '584120000000',
      lastInteraction: new Date().toISOString(),
      previousState: BOT_STATES.WAITING_MENU_OPTION,
      patient: null,
    });

    await service.handleMessage({
      from: '584120000000',
      body: 'menu',
      profileName: 'Ana',
      location: null,
      mediaUrl: null,
      mediaContentType: null,
      interactiveReplyId: null,
    });

    expect(messagingMock.sendTemplate).toHaveBeenCalledWith(
      '584120000000',
      expect.any(String),
      { name: 'Ana' },
    );
    expect(sessionStoreMock.setSession).toHaveBeenCalledWith(
      '584120000000',
      expect.objectContaining({
        currentState: BOT_STATES.WAITING_MENU_OPTION,
        previousState: BOT_STATES.TELEMEDICINE_WAITING_ID,
      }),
    );
  });

  it('shows help without losing the current state', async () => {
    sessionStoreMock.getSession.mockResolvedValue({
      currentState: BOT_STATES.TELEMEDICINE_WAITING_ID,
      from: '584120000000',
      lastInteraction: new Date().toISOString(),
      previousState: BOT_STATES.WAITING_MENU_OPTION,
      patient: null,
    });

    await service.handleMessage({
      from: '584120000000',
      body: 'ayuda',
      profileName: 'Ana',
      location: null,
      mediaUrl: null,
      mediaContentType: null,
      interactiveReplyId: null,
    });

    expect(messagingMock.sendMessage).toHaveBeenCalledWith(
      '584120000000',
      expect.stringContaining('Puedo ayudarte a navegar el bot'),
    );
    expect(sessionStoreMock.setSession).toHaveBeenCalledWith(
      '584120000000',
      expect.objectContaining({
        currentState: BOT_STATES.TELEMEDICINE_WAITING_ID,
        previousState: BOT_STATES.TELEMEDICINE_WAITING_ID,
      }),
    );
  });

  it('notifies when the previous session expired before showing the menu', async () => {
    const fortyMinutesAgo = new Date(Date.now() - 40 * 60 * 1000).toISOString();

    sessionStoreMock.getSession.mockResolvedValue({
      currentState: BOT_STATES.HOME_CARE_WAITING_LOCATION,
      from: '584120000000',
      lastInteraction: fortyMinutesAgo,
      previousState: BOT_STATES.HOME_CARE_WAITING_DOMICILE_CONFIRMATION,
      patient: null,
      municipality: 'Mariño',
    });

    await service.handleMessage({
      from: '584120000000',
      body: 'hola',
      profileName: 'Ana',
      location: null,
      mediaUrl: null,
      mediaContentType: null,
      interactiveReplyId: null,
    });

    expect(messagingMock.sendMessage).toHaveBeenCalledWith(
      '584120000000',
      expect.stringContaining('venció por inactividad'),
    );
    expect(messagingMock.sendTemplate).toHaveBeenCalledWith(
      '584120000000',
      expect.any(String),
      { name: 'Ana' },
    );
  });
});
