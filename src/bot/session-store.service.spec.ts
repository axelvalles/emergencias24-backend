import { Test, TestingModule } from '@nestjs/testing';
import { SessionStoreService } from './session-store.service';

describe('SessionStoreService', () => {
  let service: SessionStoreService;

  const redisMock = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionStoreService,
        {
          provide: 'default_IORedisModuleConnectionToken',
          useValue: redisMock,
        },
      ],
    }).compile();

    service = module.get<SessionStoreService>(SessionStoreService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
