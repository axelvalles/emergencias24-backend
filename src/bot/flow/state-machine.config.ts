import { MessagingService } from 'src/shared/messaging/messaging.service';
import { SessionStoreService } from '../session-store.service';
import { PatientsService } from 'src/patients/patients.service';
import { Patient } from 'src/patients/entities/patient.entity';

export type BotStates =
  | 'SEND_MAIN_MENU'
  | 'WAITING_MAIN_MENU_RESPONSE'
  | 'IMMEDIATE_ATTENTION_ASK_LOCATION';

type Context = {
  from: string;
  patient: Patient | null;
};

type Response = {
  nextState: BotStates;
  lastInteraction: Date;
  currentState: BotStates;
};

type Services = {
  messaging: MessagingService;
  sessionStore: SessionStoreService;
  patientsService: PatientsService;
};

type StateMachine = Record<
  BotStates,
  {
    handle(
      messagingResponse: { from: string; body: string },
      context: Context,
      serivices: Services,
    ): Promise<Response>;
  }
>;

export const stateMachineConfig: StateMachine = {
  SEND_MAIN_MENU: {
    async handle(_messagingResponse, context, serivices) {
      await serivices.messaging.sendTemplate(
        context.from,
        'HX37b03e9cb14f8bc377a12be39dcfb3b2',
      );

      return {
        nextState: 'WAITING_MAIN_MENU_RESPONSE',
        lastInteraction: new Date(),
        currentState: 'SEND_MAIN_MENU',
      };
    },
  },
  WAITING_MAIN_MENU_RESPONSE: {
    async handle(messagingResponse, context, serivices) {
      switch (messagingResponse.body) {
        case 'atencion-inmediata':
          await serivices.messaging.sendMessage(
            context.from,
            '🚑 ¿Podrías compartir tu ubicación?',
          );

          return {
            nextState: 'IMMEDIATE_ATTENTION_ASK_LOCATION',
            lastInteraction: new Date(),
            currentState: 'WAITING_MAIN_MENU_RESPONSE',
          };
        // case 'telemedicina':
        //   return {};
        // case 'atencion-domiciliaria':
        //   return {};
        // case 'consultas-medicas':
        //   return {};
        // case 'laboratorio':
        //   return {};
        // case 'ambulancia':
        //   return {};
        // case 'farmacia':
        //   return {};
        // case 'alquiler-de-equipos':
        //   return {};
        // case 'planes':
        //   return {};

        default:
          await serivices.messaging.sendMessage(
            context.from,
            'Opción no válida. Por favor, elige una opción del menú.',
          );

          return {
            nextState: 'WAITING_MAIN_MENU_RESPONSE', // Se queda en el mismo estado
            lastInteraction: new Date(),
            currentState: 'WAITING_MAIN_MENU_RESPONSE',
          };
      }
    },
  },
  IMMEDIATE_ATTENTION_ASK_LOCATION: {
    async handle(messagingResponse, context, serivices) {
      console.log(
        `El paciente ${context.from} requiere atención inmediata, esta es la direccion ${messagingResponse.body}`,
      );

      await serivices.messaging.sendMessage(
        context.from,
        `Un operador se pondra en contacto contigo pronto.`,
      );

      return {
        nextState: 'SEND_MAIN_MENU',
        lastInteraction: new Date(),
        currentState: 'IMMEDIATE_ATTENTION_ASK_LOCATION',
      };
    },
  },
};
