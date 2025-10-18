import { Body, Controller, HttpCode, Logger, Post } from '@nestjs/common';
import { BotService } from './bot.service';
import { TwilioIncomingMessage } from './interfaces/twilio-incoming-message';

@Controller('bot')
export class BotController {
  private readonly logger = new Logger(BotController.name);

  constructor(private readonly botService: BotService) {}

  @Post('incoming')
  @HttpCode(200)
  async handleIncomingMessage(@Body() payload: TwilioIncomingMessage) {
    const from = payload.From;
    const body = payload.Body;
    const profileName = payload.ProfileName || '';

    await this.botService.handleMessage({ body, from, profileName });

    return { ok: true };
  }

  @Post('status')
  handleStatusCallback(@Body() status: any) {
    console.log('Estado mensaje:', status);
  }
}
