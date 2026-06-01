import { Test, TestingModule } from '@nestjs/testing';
import { BotService } from './bot.service';
import { MessagingService } from '../shared/messaging/messaging.service';
import { SessionStoreService } from './session-store.service';
import { PatientsService } from '../patients/patients.service';
import { TicketsService } from '../tickets/tickets.service';

describe('BotService', () => {
  let service: BotService;

  const messagingMock = { sendMessage: jest.fn() };
  const sessionStoreMock = {
    getSession: jest.fn(),
    setSession: jest.fn(),
    setCurentState: jest.fn(),
  };
  const patientsServiceMock = {};
  const ticketsServiceMock = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BotService,
        { provide: MessagingService, useValue: messagingMock },
        { provide: SessionStoreService, useValue: sessionStoreMock },
        { provide: PatientsService, useValue: patientsServiceMock },
        { provide: TicketsService, useValue: ticketsServiceMock },
      ],
    }).compile();

    service = module.get<BotService>(BotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
