import {
  Body,
  Controller,
  HttpCode,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
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
  @UseGuards(TwilioWebhookGuard)
  async handleIncomingMessage(@Body() payload: TwilioIncomingMessageDto) {
    const from = payload.From;
    const profileName = payload.ProfileName || '';
    const messageType = payload.MessageType || 'text';

    let body = '';
    let location: { latitude: string; longitude: string } | null = null;
    let mediaUrl: string | null = null;
    let mediaContentType: string | null = null;
    let interactiveReplyId = '';

    if (messageType === 'location' && payload.Latitude && payload.Longitude) {
      location = {
        latitude: payload.Latitude,
        longitude: payload.Longitude,
      };
    } else if (messageType === 'interactive') {
      interactiveReplyId = payload.Body || payload.ListId || '';
      body = interactiveReplyId;
    } else if (
      messageType === 'image' ||
      messageType === 'video' ||
      messageType === 'audio'
    ) {
      mediaUrl = payload.MediaUrl0 || null;
      mediaContentType = payload.MediaContentType0 || null;
      body = payload.Body || '';
    } else {
      body = payload.Body || '';
    }

    this.logger.log(
      `Incoming ${messageType} message from ${this.maskPhone(from)}`,
    );

    await this.botService.handleMessage({
      body,
      from,
      profileName,
      location,
      mediaUrl,
      mediaContentType,
      interactiveReplyId,
    });

    return { ok: true };
  }

  @Post('status')
  @UseGuards(TwilioWebhookGuard)
  handleStatusCallback(@Body() status: TwilioStatusCallbackDto) {
    this.logger.log(
      `Status callback received: sid=${status.MessageSid} messageStatus=${status.MessageStatus ?? 'n/a'} smsStatus=${status.SmsStatus ?? 'n/a'} errorCode=${status.ErrorCode ?? 'n/a'}`,
    );

    return { ok: true };
  }
}
