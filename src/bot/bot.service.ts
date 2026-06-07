import { Injectable, Logger } from '@nestjs/common';
import { SessionStoreService } from './session-store.service';
import { MessagingService } from 'src/shared/messaging/messaging.service';
import { PatientsService } from 'src/patients/patients.service';
import { TicketsService } from 'src/tickets/tickets.service';
import { globalCommands } from './state-machine/global-commands.config';
import { stateMachine } from './state-machine';
import { MunicipalityPricingService } from 'src/municipality-pricing/municipality-pricing.service';
import {
  BOT_MESSAGES,
  sendPromptForState,
} from './state-machine/navigation.config';
import { BOT_STATES, type BotStates } from './state-machine/types';
import { SESSION_TTL_SECONDS } from './session-store.service';

@Injectable()
export class BotService {
  private readonly logger = new Logger(BotService.name);
  private readonly sessionTimeoutMs = SESSION_TTL_SECONDS * 1000;

  constructor(
    private readonly messaging: MessagingService,
    private readonly sessionStore: SessionStoreService,
    private readonly patientsService: PatientsService,
    private readonly ticketsService: TicketsService,
    private readonly municipalityPricingService: MunicipalityPricingService,
  ) {}

  async handleMessage(payload: {
    from: string;
    body: string;
    profileName: string;
    location: { latitude: string; longitude: string } | null;
    mediaUrl: string | null;
    mediaContentType: string | null;
    interactiveReplyId: string | null;
  }) {
    const from = payload.from;
    const body = payload.body.trim().toLowerCase();
    const profileName = payload.profileName;

    const services = {
      messaging: this.messaging,
      sessionStore: this.sessionStore,
      patientsService: this.patientsService,
      ticketsService: this.ticketsService,
      municipalityPricingService: this.municipalityPricingService,
    };

    const userState = await this.sessionStore.getSession(from);

    const now = Date.now();

    if (userState && userState.lastInteraction) {
      const lastInteractionTime = new Date(userState.lastInteraction).getTime();
      const diff = now - lastInteractionTime;

      if (diff > this.sessionTimeoutMs) {
        await this.messaging.sendMessage(from, BOT_MESSAGES.SESSION_EXPIRED);

        const nextState = await sendPromptForState({
          from,
          profileName,
          state: BOT_STATES.WAITING_MENU_OPTION,
          services: { messaging: this.messaging },
        });

        await this.persistSessionTransition(
          from,
          userState,
          userState.currentState,
          nextState,
        );

        return;
      }
    }

    const matchedCommand = globalCommands.find((cmd) =>
      cmd.keywords.includes(body),
    );

    if (matchedCommand) {
      const result = await matchedCommand.execute(
        {
          from,
          profileName,
          patient: userState.patient,
          currentState: userState.currentState,
          previousState: userState.previousState,
        },
        {
          messaging: this.messaging,
          sessionStore: this.sessionStore,
          patientsService: this.patientsService,
        },
      );

      await this.persistSessionTransition(
        from,
        userState,
        userState.currentState,
        result.nextState,
      );

      return;
    }

    const handler = stateMachine[userState.currentState];

    const result = await handler.handle(payload, userState, services);

    await this.persistSessionTransition(
      from,
      userState,
      userState.currentState,
      result.nextState,
      profileName,
    );
  }

  private async persistSessionTransition(
    from: string,
    currentSession: Awaited<ReturnType<SessionStoreService['getSession']>>,
    currentState: BotStates,
    requestedNextState: BotStates,
    profileName = '',
  ): Promise<void> {
    let nextState = requestedNextState;

    if (requestedNextState === BOT_STATES.START) {
      await this.messaging.sendMessage(from, BOT_MESSAGES.FLOW_COMPLETED_MENU);

      nextState = BOT_STATES.WAITING_MENU_OPTION;
    }

    await this.sessionStore.setSession(from, {
      ...currentSession,
      currentState: nextState,
      from,
      lastInteraction: new Date().toISOString(),
      previousState: currentState,
      municipality:
        nextState === BOT_STATES.WAITING_MENU_OPTION
          ? undefined
          : currentSession.municipality,
      speciality:
        nextState === BOT_STATES.WAITING_MENU_OPTION
          ? undefined
          : currentSession.speciality,
    });
  }
}
