import { TwilioWebhookDto } from '../dto/twilio-webhook.dto';
import { BotSession } from './bot-session.interface';

export interface ChatCommand {
  execute(payload: TwilioWebhookDto, botSession: BotSession): Promise<void>;
}
