import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { BotService } from './bot.service';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import {
  IncomingMessageValue,
  WebhookValue,
  WhatsAppWebhookPayload,
} from './interfaces/whatsapp-webhook.interface';

@Controller('bot')
export class BotController {
  private readonly verifyToken: string;
  private readonly identifier: string;

  constructor(
    private readonly botService: BotService,
    private readonly configService: ConfigService,
  ) {
    this.verifyToken =
      this.configService.get<string>('WHATSAPP_VERIFY_TOKEN') || '';
    this.identifier =
      this.configService.get<string>('WHATSAPP_IDENTIFIER') || '';
  }

  @Get()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    if (mode === 'subscribe' && token === this.verifyToken) {
      console.log('¡Webhook verificado exitosamente!');
      // Respondemos con el challenge y un status 200 OK
      res.status(HttpStatus.OK).send(challenge);
    } else {
      console.error(
        'Fallo en la verificación del webhook. Los tokens no coinciden.',
      );
      // Si no, respondemos con un error 403 Prohibido
      res.sendStatus(HttpStatus.FORBIDDEN);
    }
  }

  @Post()
  async handleWebhook(
    @Body() body: WhatsAppWebhookPayload,
    @Res() res: Response,
  ) {
    const value = body.entry[0].changes[0].value;

    if (value) {
      if (this.isIncomingMessage(value)) {
        const messageBody = value.messages[0].text.body;
        console.log(`MENSAJE RECIBIDO: ${JSON.stringify(value, null, 2)}`);

        await this.botService.handleMessage({
          from: value.messages[0].from,
          body: value.messages[0].text.body,
        });
      } else {
        const status = value.statuses[0].status;
        console.log(`ESTADO ACTUALIZADO: ${status}`);
      }
    }

    // Respondemos 200 OK para confirmar la recepción a Meta
    res.sendStatus(HttpStatus.OK);
  }

  private isIncomingMessage(
    value: WebhookValue,
  ): value is IncomingMessageValue {
    return 'messages' in value && value.messages !== undefined;
  }
}
