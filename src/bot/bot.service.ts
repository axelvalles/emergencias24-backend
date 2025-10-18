import { Injectable, Logger } from '@nestjs/common';
import { SessionStoreService } from './session-store.service';
import { MessagingService } from 'src/shared/messaging/messaging.service';
import { stateMachineConfig } from './flow/state-machine.config';
import { PatientsService } from 'src/patients/patients.service';
import { globalCommands } from './flow/global-commands.config';

@Injectable()
export class BotService {
  private readonly logger = new Logger(BotService.name);

  constructor(
    private readonly messaging: MessagingService,
    private readonly sessionStore: SessionStoreService,
    private readonly patientsService: PatientsService,
  ) {}

  async handleMessage(payload: {
    from: string;
    body: string;
    profileName: string;
  }) {
    const from = payload.from;
    const body = payload.body.trim().toLowerCase();
    const profileName = payload.profileName;
    console.log(from);

    const userState = await this.sessionStore.getSession(from);

    const matchedCommand = globalCommands.find((cmd) =>
      cmd.keywords.includes(body),
    );

    if (matchedCommand) {
      const result = await matchedCommand.execute(
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

    const stateHandler = stateMachineConfig[userState.currentState];
    const result = await stateHandler.handle(payload, userState, {
      messaging: this.messaging,
      sessionStore: this.sessionStore,
      patientsService: this.patientsService,
    });

    await this.sessionStore.setSession(from, {
      currentState: result.nextState,
      from,
      lastInteraction: new Date().toISOString(),
      previousState: userState.currentState,
      patient: userState.patient,
    });
  }
}
