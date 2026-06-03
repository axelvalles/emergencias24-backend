import { Injectable, Logger } from '@nestjs/common';
import { SessionStoreService } from './session-store.service';
import { MessagingService } from 'src/shared/messaging/messaging.service';
import { PatientsService } from 'src/patients/patients.service';
import { TicketsService } from 'src/tickets/tickets.service';
import { globalCommands } from './state-machine/global-commands.config';
import { stateMachine } from './state-machine';

@Injectable()
export class BotService {
  private readonly logger = new Logger(BotService.name);

  constructor(
    private readonly messaging: MessagingService,
    private readonly sessionStore: SessionStoreService,
    private readonly patientsService: PatientsService,
    private readonly ticketsService: TicketsService,
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
    };

    const userState = await this.sessionStore.getSession(from);

    const now = Date.now();

    if (userState && userState.lastInteraction) {
      const lastInteractionTime = new Date(userState.lastInteraction).getTime();
      const diff = now - lastInteractionTime;

      if (diff > 3600000) {
        const result = await globalCommands[0].execute(
          { from, profileName, patient: userState.patient },
          {
            messaging: this.messaging,
            sessionStore: this.sessionStore,
            patientsService: this.patientsService,
          },
        );

        await this.sessionStore.setSession(from, {
          currentState: result.nextState,
          from,
          lastInteraction: new Date().toISOString(),
          previousState: userState.currentState,
          patient: userState.patient,
        });

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
        },
        {
          messaging: this.messaging,
          sessionStore: this.sessionStore,
          patientsService: this.patientsService,
        },
      );

      await this.sessionStore.setSession(from, {
        currentState: result.nextState,
        from,
        lastInteraction: new Date().toISOString(),
        previousState: userState.currentState,
        patient: userState.patient,
      });

      return;
    }

    const handler = stateMachine[userState.currentState];

    const result = await handler.handle(payload, userState, services);

    await this.sessionStore.setCurentState(from, result.nextState);
  }
}
