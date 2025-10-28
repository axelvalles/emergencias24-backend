import { MessagingService } from 'src/shared/messaging/messaging.service';
import { SessionStoreService } from '../session-store.service';
import { PatientsService } from 'src/patients/patients.service';
import { BotStates } from './state-machine.config';
import { TWILIO_TEMPLATES } from '../state-machine/templates';

type Services = {
  messaging: MessagingService;
  sessionStore: SessionStoreService;
  patientsService: PatientsService;
};

type Context = {
  from: string;
  patient: any;
  profileName: string;
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
      await services.messaging.sendTemplate(
        context.from,
        TWILIO_TEMPLATES.MAIN_MENU,
        { name: context.profileName },
      );

      return { nextState: 'WAITING_MENU_OPTION' };
    },
  },
  {
    keywords: ['ayuda', 'help'],
    async execute(context, services) {
      await services.messaging.sendMessage(
        context.from,
        '📖 Puedes escribir "menu" para volver al menú principal o "ayuda" para ver este mensaje nuevamente.',
      );
      return { nextState: 'START' };
    },
  },
];
