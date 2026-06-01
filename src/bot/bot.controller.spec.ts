import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BotController } from './bot.controller';
import { BotService } from './bot.service';
import { TwilioWebhookGuard } from './twilio-webhook.guard';

describe('BotController', () => {
  let controller: BotController;

  const botServiceMock = {
    handleMessage: jest.fn(),
  };

  const configServiceMock = {
    getOrThrow: jest.fn().mockReturnValue('test-auth-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BotController],
      providers: [
        { provide: BotService, useValue: botServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
        TwilioWebhookGuard,
      ],
    }).compile();

    controller = module.get<BotController>(BotController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
