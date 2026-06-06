import { MessagingService } from 'src/shared/messaging/messaging.service';
import { SessionStoreService } from '../session-store.service';
import { PatientsService } from 'src/patients/patients.service';
import { BOT_STATES, BotStates } from './types';
import { Patient } from 'src/patients/entities/patient.entity';
import {
  BOT_MESSAGES,
  getPreviousState,
  sendPromptForState,
} from './navigation.config';

type Services = {
  messaging: MessagingService;
  sessionStore: SessionStoreService;
  patientsService: PatientsService;
};

type Context = {
  from: string;
  patient: Patient | null;
  profileName: string;
  currentState: BotStates;
  previousState: BotStates;
};

export type GlobalCommandHandler = {
  keywords: string[]; // palabras clave que disparan el comando
  execute(
    context: Context,
    services: Services,
  ): Promise<{
    nextState: BotStates;
  }>;
};

export const globalCommands: GlobalCommandHandler[] = [
  {
    keywords: ['menu', 'inicio'],
    async execute(context, services) {
      const nextState = await sendPromptForState({
        from: context.from,
        profileName: context.profileName,
        state: BOT_STATES.WAITING_MENU_OPTION,
        services,
      });

      return { nextState };
    },
  },
  {
    keywords: ['ayuda', 'help'],
    async execute(context, services) {
      await services.messaging.sendMessage(context.from, BOT_MESSAGES.HELP);

      return { nextState: context.currentState };
    },
  },
  {
    keywords: ['volver', 'atras', 'atrás'],
    async execute(context, services) {
      const previousState = getPreviousState(
        context.currentState,
        context.previousState,
      );

      const nextState = await sendPromptForState({
        from: context.from,
        profileName: context.profileName,
        state: previousState,
        services,
      });

      return { nextState };
    },
  },
  {
    keywords: ['cancelar', 'salir'],
    async execute(context, services) {
      await services.messaging.sendMessage(
        context.from,
        BOT_MESSAGES.CANCELLED,
      );

      const nextState = await sendPromptForState({
        from: context.from,
        profileName: context.profileName,
        state: BOT_STATES.WAITING_MENU_OPTION,
        services,
      });

      return { nextState };
    },
  },
];
