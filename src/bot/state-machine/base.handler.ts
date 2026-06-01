import {
  MessagingInput,
  Context,
  Services,
  Response,
  BotStates,
} from './types';

export abstract class BaseHandler {
  abstract state: BotStates;

  protected now(): string {
    return new Date().toISOString();
  }

  protected async invalidResponse(
    services: Services,
    messagingResponse: MessagingInput,
    message: string,
    currentState: BotStates,
  ): Promise<Response> {
    await services.messaging.sendMessage(messagingResponse.from, message);
    return {
      nextState: currentState,
      lastInteraction: this.now(),
      currentState,
    };
  }

  abstract handle(
    messagingResponse: MessagingInput,
    context: Context,
    services: Services,
  ): Promise<Response>;
}
