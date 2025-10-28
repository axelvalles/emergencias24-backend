import { Patient } from 'src/patients/entities/patient.entity';
import { MessagingService } from 'src/shared/messaging/messaging.service';
import { SessionStoreService } from '../session-store.service';
import { PatientsService } from 'src/patients/patients.service';
import { ServiceType, Priority } from 'src/tickets/entities/ticket.entity';

export type BotStates =
  | 'START'
  | 'WAITING_MENU_OPTION'
  | 'WAITING_LOCATION'
  | 'WAITING_CI'
  | 'WAITING_MUNICIPIO'
  | 'WAITING_DOMICILE_CONFIRMATION'
  | 'WAITING_LOCATION_DOMICILE'
  | 'WAITING_SPECIALTY'
  | 'WAITING_LAB_TEST'
  | 'WAITING_MUNICIPIO_TRANSFER'
  | 'WAITING_CONFIRMATION_TRANSFER'
  | 'WAITING_LOCATION_TRANSFER'
  | 'WAITING_APPOINTMENT_CONFIRMATION';

type Context = {
  patient: Patient | null;
};

type Response = {
  nextState: BotStates;
  lastInteraction: string;
  currentState: BotStates;
};

import { TicketsService } from 'src/tickets/tickets.service';
import { TWILIO_TEMPLATES } from '../state-machine/templates';

type Services = {
  messaging: MessagingService;
  sessionStore: SessionStoreService;
  patientsService: PatientsService;
  ticketsService: TicketsService;
};

type StateMachine = Record<
  BotStates,
  {
    handle(
      messagingResponse: {
        from: string;
        body: string;
        profileName: string;
        location: { latitude: string; longitude: string } | null;
      },
      context: Context,
      serivices: Services,
    ): Promise<Response>;
  }
>;

export const stateMachineConfig: StateMachine = {
  START: {
    async handle(messagingResponse, _context, services) {
      console.log(messagingResponse);

      await services.messaging.sendTemplate(
        messagingResponse.from,
        TWILIO_TEMPLATES.MAIN_MENU,
        { name: messagingResponse.profileName || '' },
      );

      return {
        nextState: 'WAITING_MENU_OPTION',
        lastInteraction: new Date().toISOString(),
        currentState: 'START',
      };
    },
  },
  WAITING_MENU_OPTION: {
    async handle(messagingResponse, context, services) {
      switch (messagingResponse.body) {
        case 'atencion-inmediata':
          await services.messaging.sendMessage(
            messagingResponse.from,
            'Para coordinar la ayuda de inmediato, por favor, envíame tu ubicación actual.',
          );

          return {
            nextState: 'WAITING_LOCATION',
            lastInteraction: new Date().toISOString(),
            currentState: 'WAITING_MENU_OPTION',
          };
        case 'telemedicina':
          await services.messaging.sendMessage(
            messagingResponse.from,
            'Para continuar con la telemedicina, por favor, indícame tu número de Cédula de Identidad.',
          );

          return {
            nextState: 'WAITING_CI',
            lastInteraction: new Date().toISOString(),
            currentState: 'WAITING_MENU_OPTION',
          };
        case 'atencion-domiciliaria':
          await services.messaging.sendMessage(
            messagingResponse.from,
            `¿En qué municipio necesitas la atención domiciliaria?
            1. Mariño
            2. Maneiro
            3. García
            4. Arismendi
            5. Antolin
            6. Gomez
            7. Marcano
            8. Díaz
            9. Tubores
            10. P macanao
            `,
          );

          return {
            nextState: 'WAITING_MUNICIPIO',
            lastInteraction: new Date().toISOString(),
            currentState: 'WAITING_MENU_OPTION',
          };
        case 'consultas-medicas':
          await services.messaging.sendMessage(
            messagingResponse.from,
            '¿Para qué especialidad médica necesitas una consulta?',
          );

          return {
            nextState: 'WAITING_SPECIALTY',
            lastInteraction: new Date().toISOString(),
            currentState: 'WAITING_MENU_OPTION',
          };
        case 'laboratorio': {
          await services.messaging.sendMessage(
            messagingResponse.from,
            '¿Que pruebas desea realizar?',
          );

          return {
            nextState: 'WAITING_LAB_TEST',
            lastInteraction: new Date().toISOString(),
            currentState: 'WAITING_MENU_OPTION',
          };
        }
        case 'ambulancia': {
          await services.messaging.sendMessage(
            messagingResponse.from,
            '¿En qué municipio necesitas el traslado?',
          );

          return {
            nextState: 'WAITING_MUNICIPIO_TRANSFER',
            lastInteraction: new Date().toISOString(),
            currentState: 'WAITING_MENU_OPTION',
          };
        }
        case 'farmacia':
          await services.messaging.sendMessage(
            messagingResponse.from,
            'Para contactar a nuestra farmacia, por favor comunícate a través de este enlace: [Enlace a WhatsApp del 04227426303]',
          );

          return {
            nextState: 'START',
            lastInteraction: new Date().toISOString(),
            currentState: 'WAITING_MENU_OPTION',
          };
        default:
          await services.messaging.sendMessage(
            messagingResponse.from,
            'Opción no válida. Por favor, elige una opción del menú.',
          );

          return {
            nextState: 'WAITING_MENU_OPTION',
            lastInteraction: new Date().toISOString(),
            currentState: 'WAITING_MENU_OPTION',
          };
      }
    },
  },
  WAITING_LOCATION: {
    async handle(messagingResponse, _context, services) {
      const isValidLocationText = messagingResponse.body.trim() !== '';
      const isValidLocation = messagingResponse.location !== null;

      if (!isValidLocation && !isValidLocationText) {
        await services.messaging.sendMessage(
          messagingResponse.from,
          'Por favor, escribe una ubicación para poder continuar.',
        );

        return {
          nextState: 'WAITING_LOCATION',
          lastInteraction: new Date().toISOString(),
          currentState: 'WAITING_LOCATION',
        };
      }

      const location = messagingResponse.location;

      await services.ticketsService.create({
        serviceType: ServiceType.IMMEDIATE_ATTENTION,
        priority: Priority.URGENT,
        requesterPhone: messagingResponse.from,
        requesterName: messagingResponse.profileName,
        location: location
          ? `${location.latitude},${location.longitude}`
          : undefined,
        municipality: 'No especificado',
        description: location
          ? `Solicitud de atención inmediata en coordenadas (${location.latitude}, ${location.longitude})`
          : `Solicitud de atención inmediata en la ubicación: ${messagingResponse.body.trim()}`,
      });

      await services.messaging.sendMessage(
        messagingResponse.from,
        `¡Ubicación recibida! Hemos generado un ticket de servicio, un operador le contectara de inmediato.`,
      );

      return {
        nextState: 'START',
        lastInteraction: new Date().toISOString(),
        currentState: 'WAITING_LOCATION',
      };
    },
  },
  WAITING_CI: {
    async handle(messagingResponse, _context, services) {
      const ciRegex = /^\d{7,8}$/;
      const isValidCI = ciRegex.test(messagingResponse.body.trim());

      if (!isValidCI) {
        await services.messaging.sendMessage(
          messagingResponse.from,
          'El número ingresado no parece ser válido. Por favor, ingrésalo nuevamente.',
        );

        return {
          nextState: 'WAITING_CI',
          lastInteraction: new Date().toISOString(),
          currentState: 'WAITING_CI',
        };
      }

      const patient = await services.patientsService.findByDocument(
        messagingResponse.body.trim(),
      );

      if (!patient) {
        await services.messaging.sendMessage(
          messagingResponse.from,
          'Parece que no estas registrado. Si quieres afiliarte puedes enviar un correo a analista@emergencias24ve.com',
        );

        return {
          nextState: 'START',
          lastInteraction: new Date().toISOString(),
          currentState: 'WAITING_CI',
        };
      }

      // TODO: Generar alerta a operador en despacho

      await services.messaging.sendMessage(
        messagingResponse.from,
        `Gracias ${patient.fullName}. Hemos enviado tu solicitud. Un médico de guardia te contactará en breve.`,
      );

      return {
        nextState: 'START',
        lastInteraction: new Date().toISOString(),
        currentState: 'WAITING_CI',
      };
    },
  },
  WAITING_MUNICIPIO: {
    async handle(messagingResponse, context, services) {
      const municipio = messagingResponse.body.trim();

      // TODO: convertir esto en lista
      if (!municipio) {
        await services.messaging.sendMessage(
          messagingResponse.from,
          'Por favor, indica un municipio para continuar.',
        );

        return {
          nextState: 'WAITING_MUNICIPIO',
          lastInteraction: new Date().toISOString(),
          currentState: 'WAITING_MUNICIPIO',
        };
      }

      // TODO: Buscar los costos por base de dato
      await services.messaging.sendMessage(
        messagingResponse.from,
        `Para el municipio ${municipio}, el costo es de x. ¿Deseas solicitar el servicio? (Sí/No)`,
      );

      return {
        nextState: 'WAITING_DOMICILE_CONFIRMATION',
        lastInteraction: new Date().toISOString(),
        currentState: 'WAITING_MUNICIPIO',
      };
    },
  },
  WAITING_DOMICILE_CONFIRMATION: {
    async handle(messagingResponse, context, services) {
      const response = messagingResponse.body.toLowerCase().trim();

      if (response === 'no') {
        await services.messaging.sendMessage(
          messagingResponse.from,
          'Entendido. ¿Hay algo más en lo que pueda ayudarte?',
        );

        return {
          nextState: 'START',
          lastInteraction: new Date().toISOString(),
          currentState: 'WAITING_DOMICILE_CONFIRMATION',
        };
      }

      if (response === 'sí' || response === 'si') {
        // TODO debe permitir location en mapa
        await services.messaging.sendMessage(
          messagingResponse.from,
          'Por favor, envíame tu ubicación exacta, para que nuestro equipo llegue de manera inmediata.',
        );

        return {
          nextState: 'WAITING_LOCATION_DOMICILE',
          lastInteraction: new Date().toISOString(),
          currentState: 'WAITING_DOMICILE_CONFIRMATION',
        };
      }

      await services.messaging.sendMessage(
        messagingResponse.from,
        'Por favor, responde con "Sí" o "No".',
      );

      return {
        nextState: 'WAITING_DOMICILE_CONFIRMATION',
        lastInteraction: new Date().toISOString(),
        currentState: 'WAITING_DOMICILE_CONFIRMATION',
      };
    },
  },
  WAITING_LOCATION_DOMICILE: {
    async handle(messagingResponse, context, services) {
      // TODO: Generar alerta a operador en despacho

      await services.messaging.sendMessage(
        messagingResponse.from,
        'Perfecto. Un operador se comunicará contigo para confirmar los detalles.',
      );

      return {
        nextState: 'START',
        lastInteraction: new Date().toISOString(),
        currentState: 'WAITING_DOMICILE_CONFIRMATION',
      };
    },
  },
  WAITING_SPECIALTY: {
    async handle(messagingResponse, context, services) {
      const specialty = messagingResponse.body.trim();

      // TODO: convertir en lista
      if (!specialty) {
        await services.messaging.sendMessage(
          messagingResponse.from,
          'Por favor, indica una especialidad para continuar.',
        );

        return {
          nextState: 'WAITING_SPECIALTY',
          lastInteraction: new Date().toISOString(),
          currentState: 'WAITING_SPECIALTY',
        };
      }

      // TODO: Traer precios de base de datos
      await services.messaging.sendMessage(
        messagingResponse.from,
        `Las consultas de ${specialty} tienen un costo de X. ¿Deseas agendar una cita? (Sí/No)`,
      );

      return {
        nextState: 'WAITING_APPOINTMENT_CONFIRMATION',
        lastInteraction: new Date().toISOString(),
        currentState: 'WAITING_SPECIALTY',
      };
    },
  },
  WAITING_LAB_TEST: {
    async handle(messagingResponse, context, services) {
      // TODO: Generar alerta a operador en despacho

      await services.messaging.sendMessage(
        messagingResponse.from,
        'Perfecto. En breve le enviaremos los costos de su requerimiento.',
      );

      return {
        nextState: 'START',
        lastInteraction: new Date().toISOString(),
        currentState: 'WAITING_DOMICILE_CONFIRMATION',
      };
    },
  },
  WAITING_MUNICIPIO_TRANSFER: {
    async handle(messagingResponse, context, services) {
      // TODO: Generar alerta a operador en despacho

      const municipio = messagingResponse.body.trim();

      // TODO: convertir esto en lista
      if (!municipio) {
        await services.messaging.sendMessage(
          messagingResponse.from,
          'Por favor, indica un municipio para continuar.',
        );

        return {
          nextState: 'WAITING_MUNICIPIO',
          lastInteraction: new Date().toISOString(),
          currentState: 'WAITING_MUNICIPIO',
        };
      }

      await services.messaging.sendMessage(
        messagingResponse.from,
        `Para el municipio ${municipio}, el costo es de x. ¿Deseas solicitar el servicio? (Sí/No)`,
      );

      return {
        nextState: 'WAITING_CONFIRMATION_TRANSFER',
        lastInteraction: new Date().toISOString(),
        currentState: 'WAITING_DOMICILE_CONFIRMATION',
      };
    },
  },
  WAITING_CONFIRMATION_TRANSFER: {
    async handle(messagingResponse, context, services) {
      const response = messagingResponse.body.toLowerCase().trim();

      if (response === 'no') {
        await services.messaging.sendMessage(
          messagingResponse.from,
          'Entendido. ¿Hay algo más en lo que pueda ayudarte?',
        );

        return {
          nextState: 'START',
          lastInteraction: new Date().toISOString(),
          currentState: 'WAITING_CONFIRMATION_TRANSFER',
        };
      }

      if (response === 'sí' || response === 'si') {
        // TODO debe permitir location en mapa
        await services.messaging.sendMessage(
          messagingResponse.from,
          'Por favor, envíame tu ubicación exacta, para que nuestra unidad llegue de manera inmediata.',
        );

        return {
          nextState: 'WAITING_LOCATION_TRANSFER',
          lastInteraction: new Date().toISOString(),
          currentState: 'WAITING_CONFIRMATION_TRANSFER',
        };
      }

      await services.messaging.sendMessage(
        messagingResponse.from,
        'Por favor, responde con "Sí" o "No".',
      );

      return {
        nextState: 'WAITING_CONFIRMATION_TRANSFER',
        lastInteraction: new Date().toISOString(),
        currentState: 'WAITING_CONFIRMATION_TRANSFER',
      };
    },
  },
  WAITING_LOCATION_TRANSFER: {
    async handle(messagingResponse, context, services) {
      // Crear ticket de ambulancia
      const location = messagingResponse.body.trim();

      await services.ticketsService.create({
        serviceType: ServiceType.AMBULANCE,
        priority: Priority.URGENT,
        patientId: context.patient?.id?.toString(),
        requesterPhone: messagingResponse.from,
        requesterName: messagingResponse.profileName,
        location: location,
        municipality: 'No especificado', // TODO: Obtener del contexto del estado anterior
        description: `Solicitud de ambulancia desde ${location}`,
      });

      await services.messaging.sendMessage(
        messagingResponse.from,
        'Perfecto. Un operador se comunicará contigo para confirmar los detalles.',
      );

      return {
        nextState: 'START',
        lastInteraction: new Date().toISOString(),
        currentState: 'WAITING_LOCATION_TRANSFER',
      };
    },
  },
  WAITING_APPOINTMENT_CONFIRMATION: {
    async handle(messagingResponse, context, services) {
      const response = messagingResponse.body.toLowerCase().trim();

      if (response === 'no') {
        await services.messaging.sendMessage(
          messagingResponse.from,
          'De acuerdo. Si necesitas algo más, no dudes en consultarme.',
        );

        return {
          nextState: 'START',
          lastInteraction: new Date().toISOString(),
          currentState: 'WAITING_APPOINTMENT_CONFIRMATION',
        };
      }

      if (response === 'sí' || response === 'si') {
        // TODO: Transfer conversation to operator at 04227426301
        console.log(
          `Transferir conversación para cita de ${messagingResponse.from}`,
        );

        await services.messaging.sendMessage(
          messagingResponse.from,
          '¡Excelente! Te estoy transfiriendo con nuestro personal de control de citas.',
        );

        return {
          nextState: 'START',
          lastInteraction: new Date().toISOString(),
          currentState: 'WAITING_APPOINTMENT_CONFIRMATION',
        };
      }

      await services.messaging.sendMessage(
        messagingResponse.from,
        'Por favor, responde con "Sí" o "No".',
      );

      return {
        nextState: 'WAITING_APPOINTMENT_CONFIRMATION',
        lastInteraction: new Date().toISOString(),
        currentState: 'WAITING_APPOINTMENT_CONFIRMATION',
      };
    },
  },
};
