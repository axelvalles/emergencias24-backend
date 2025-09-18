import { Body, Controller, Post } from '@nestjs/common';
import { TwilioWebhookDto } from './dto/twilio-webhook.dto';
import { BotService } from './bot.service';

@Controller('bot')
export class BotController {
  constructor(private readonly botService: BotService) {}

  @Post('/webhook')
  handleWebhook(@Body() body: TwilioWebhookDto) {
    return this.botService.handleMessage(body);
  }
}
