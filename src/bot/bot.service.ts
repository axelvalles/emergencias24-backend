import { Injectable, Logger } from '@nestjs/common';
import { SessionStoreService } from './session-store.service';
import { MessagingService } from 'src/shared/messaging/messaging.service';
import { stateMachineConfig } from './flow/state-machine.config';
import { PatientsService } from 'src/patients/patients.service';

@Injectable()
export class BotService {
  private readonly logger = new Logger(BotService.name);

  constructor(
    private readonly messaging: MessagingService,
    private readonly sessionStore: SessionStoreService,
    private readonly patientsService: PatientsService,
  ) {
    // console.log('se reinicio');
    // this.sessionStore.clearSession('whatsapp:+573214174283');
  }

  async handleMessage(payload: { from: string; body: string }) {
    const from = payload.from;

    await this.messaging.sendMessage(from, 'Hola');

    return;

    const userState = await this.sessionStore.getSession(from);

    const stateHandler = stateMachineConfig[userState.currentState];

    const result = await stateHandler.handle(payload, userState, {
      messaging: this.messaging,
      sessionStore: this.sessionStore,
      patientsService: this.patientsService,
    });

    await this.sessionStore.setSession(from, {
      currentState: result.nextState,
      from,
      lastInteraction: new Date(),
      previousState: userState.currentState,
      patient: userState.patient,
    });
  }
}
