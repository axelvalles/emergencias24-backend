import {
  Body,
  Controller,
  HttpCode,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { BotService } from './bot.service';
import { TwilioWebhookGuard } from './twilio-webhook.guard';
import {
  TwilioIncomingMessageDto,
  TwilioStatusCallbackDto,
} from './dto/twilio-webhook.dto';

@Controller('bot')
export class BotController {
  private readonly logger = new Logger(BotController.name);

  constructor(private readonly botService: BotService) {}

  private maskPhone(value: string): string {
    if (value.length <= 4) {
      return '****';
    }

    return `***${value.slice(-4)}`;
  }

  @Post('incoming')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @UseGuards(TwilioWebhookGuard)
  async handleIncomingMessage(@Body() payload: TwilioIncomingMessageDto) {
    const from = payload.From;
    const body = payload.Body || '';
    const profileName = payload.ProfileName || '';
    const location =
      payload.Latitude && payload.Longitude
        ? {
            latitude: payload.Latitude,
            longitude: payload.Longitude,
          }
        : null;

    this.logger.log(`Incoming message from ${this.maskPhone(from)}`);
    await this.botService.handleMessage({ body, from, profileName, location });

    return { ok: true };
  }

  @Post('status')
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  @UseGuards(TwilioWebhookGuard)
  handleStatusCallback(@Body() status: TwilioStatusCallbackDto) {
    this.logger.log(
      `Status callback received: sid=${status.MessageSid} messageStatus=${status.MessageStatus ?? 'n/a'} smsStatus=${status.SmsStatus ?? 'n/a'} errorCode=${status.ErrorCode ?? 'n/a'}`,
    );

    return { ok: true };
  }
}
