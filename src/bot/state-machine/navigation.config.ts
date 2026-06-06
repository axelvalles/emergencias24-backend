import { TWILIO_MESSSAGES, TWILIO_TEMPLATES } from './templates';
import { BOT_STATES, type BotStates, type Services } from './types';

export const BOT_MESSAGES = {
  NAVIGATION_HINT:
    'Escribe "menu" para volver al inicio, "volver" para regresar al paso anterior o "cancelar" para salir de este proceso.',
  HELP: `Puedo ayudarte a navegar el bot con estos comandos:\n\n- menu: volver al menú principal\n- volver: regresar al paso anterior\n- cancelar: salir del flujo actual\n- ayuda: ver esta guía nuevamente\n\nSi no estás seguro de qué hacer, escribe "menu" y te muestro las opciones disponibles.`,
  CANCELLED:
    'He cancelado el proceso actual. Te mostraré el menú principal para que elijas una nueva opción.',
  SESSION_EXPIRED:
    'Tu sesión anterior venció por inactividad. Te mostraré nuevamente el menú principal para continuar.',
  HOME_CARE_CONFIRMATION:
    '¿Deseas solicitar el servicio? Responde "Sí" o "No".',
  AMBULANCE_CONFIRMATION:
    '¿Deseas solicitar el servicio? Responde "Sí" o "No".',
  IMMEDIATE_ATTENTION_LOCATION:
    'Para coordinar la ayuda de inmediato, por favor, envíame tu ubicación actual.',
  HOME_CARE_LOCATION:
    'Por favor, envíame tu ubicación exacta para que nuestro equipo llegue de manera inmediata.',
  AMBULANCE_LOCATION:
    'Por favor, envíame tu ubicación exacta para que nuestra unidad llegue de manera inmediata.',
  TELEMEDICINE_ID:
    'Para continuar con la telemedicina, por favor, indícame tu número de Cédula de Identidad.',
  LABORATORY_TESTS: '¿Qué pruebas deseas realizar?',
  MEDICAL_OTHER: 'Escribe la especialidad que necesitas.',
  FLOW_COMPLETED_MENU:
    'Listo. Ahora te mostraré el menú principal por si necesitas otra gestión.',
} as const;

const PREVIOUS_STATE_BY_CURRENT: Partial<Record<BotStates, BotStates>> = {
  [BOT_STATES.WAITING_MENU_OPTION]: BOT_STATES.WAITING_MENU_OPTION,
  [BOT_STATES.IMMEDIATE_ATTENTION_WAITING_LOCATION]:
    BOT_STATES.WAITING_MENU_OPTION,
  [BOT_STATES.TELEMEDICINE_WAITING_ID]: BOT_STATES.WAITING_MENU_OPTION,
  [BOT_STATES.HOME_CARE_WAITING_MUNICIPALITY]: BOT_STATES.WAITING_MENU_OPTION,
  [BOT_STATES.HOME_CARE_WAITING_DOMICILE_CONFIRMATION]:
    BOT_STATES.HOME_CARE_WAITING_MUNICIPALITY,
  [BOT_STATES.HOME_CARE_WAITING_LOCATION]:
    BOT_STATES.HOME_CARE_WAITING_DOMICILE_CONFIRMATION,
  [BOT_STATES.MEDICAL_CONSULTATIONS_WAITING_SPECIALTY]:
    BOT_STATES.WAITING_MENU_OPTION,
  [BOT_STATES.MEDICAL_CONSULTATIONS_WAITING_OTHER]:
    BOT_STATES.MEDICAL_CONSULTATIONS_WAITING_SPECIALTY,
  [BOT_STATES.LABORATORY_WAITING_TEST]: BOT_STATES.WAITING_MENU_OPTION,
  [BOT_STATES.AMBULANCE_WAITING_MUNICIPALITY]: BOT_STATES.WAITING_MENU_OPTION,
  [BOT_STATES.AMBULANCE_WAITING_CONFIRMATION]:
    BOT_STATES.AMBULANCE_WAITING_MUNICIPALITY,
  [BOT_STATES.AMBULANCE_WAITING_LOCATION]:
    BOT_STATES.AMBULANCE_WAITING_CONFIRMATION,
  [BOT_STATES.EQUIPMENT_RENTAL_WAITING_OPTION]: BOT_STATES.WAITING_MENU_OPTION,
  [BOT_STATES.PLAN_WAITING_OPTION]: BOT_STATES.WAITING_MENU_OPTION,
};

export function withNavigationHint(message: string): string {
  return `${message}\n\n${BOT_MESSAGES.NAVIGATION_HINT}`;
}

export function getPreviousState(
  currentState: BotStates,
  previousState?: BotStates,
): BotStates {
  return (
    previousState ??
    PREVIOUS_STATE_BY_CURRENT[currentState] ??
    BOT_STATES.WAITING_MENU_OPTION
  );
}

export async function sendPromptForState(params: {
  from: string;
  profileName: string;
  state: BotStates;
  services: Pick<Services, 'messaging'>;
}): Promise<BotStates> {
  const { from, profileName, state, services } = params;

  switch (state) {
    case BOT_STATES.START:
    case BOT_STATES.WAITING_MENU_OPTION:
      await services.messaging.sendTemplate(from, TWILIO_TEMPLATES.MAIN_MENU, {
        name: profileName || '',
      });
      return BOT_STATES.WAITING_MENU_OPTION;

    case BOT_STATES.IMMEDIATE_ATTENTION_WAITING_LOCATION:
      await services.messaging.sendMessage(
        from,
        withNavigationHint(BOT_MESSAGES.IMMEDIATE_ATTENTION_LOCATION),
      );
      return state;

    case BOT_STATES.TELEMEDICINE_WAITING_ID:
      await services.messaging.sendMessage(
        from,
        withNavigationHint(BOT_MESSAGES.TELEMEDICINE_ID),
      );
      return state;

    case BOT_STATES.HOME_CARE_WAITING_MUNICIPALITY:
      await services.messaging.sendMessage(
        from,
        withNavigationHint(TWILIO_MESSSAGES.HOME_CARE_MUNICIPALITIES),
      );
      return state;

    case BOT_STATES.HOME_CARE_WAITING_DOMICILE_CONFIRMATION:
      await services.messaging.sendMessage(
        from,
        withNavigationHint(BOT_MESSAGES.HOME_CARE_CONFIRMATION),
      );
      return state;

    case BOT_STATES.HOME_CARE_WAITING_LOCATION:
      await services.messaging.sendMessage(
        from,
        withNavigationHint(BOT_MESSAGES.HOME_CARE_LOCATION),
      );
      return state;

    case BOT_STATES.MEDICAL_CONSULTATIONS_WAITING_SPECIALTY:
      await services.messaging.sendMessage(
        from,
        withNavigationHint(TWILIO_MESSSAGES.MEDICAL_CONSULTATIONS_SPECIALITY),
      );
      return state;

    case BOT_STATES.MEDICAL_CONSULTATIONS_WAITING_OTHER:
      await services.messaging.sendMessage(
        from,
        withNavigationHint(BOT_MESSAGES.MEDICAL_OTHER),
      );
      return state;

    case BOT_STATES.LABORATORY_WAITING_TEST:
      await services.messaging.sendMessage(
        from,
        withNavigationHint(BOT_MESSAGES.LABORATORY_TESTS),
      );
      return state;

    case BOT_STATES.AMBULANCE_WAITING_MUNICIPALITY:
      await services.messaging.sendMessage(
        from,
        withNavigationHint(TWILIO_MESSSAGES.AMBULANCE_MUNICIPALITIES),
      );
      return state;

    case BOT_STATES.AMBULANCE_WAITING_CONFIRMATION:
      await services.messaging.sendMessage(
        from,
        withNavigationHint(BOT_MESSAGES.AMBULANCE_CONFIRMATION),
      );
      return state;

    case BOT_STATES.AMBULANCE_WAITING_LOCATION:
      await services.messaging.sendMessage(
        from,
        withNavigationHint(BOT_MESSAGES.AMBULANCE_LOCATION),
      );
      return state;

    case BOT_STATES.EQUIPMENT_RENTAL_WAITING_OPTION:
      await services.messaging.sendMessage(
        from,
        withNavigationHint(TWILIO_MESSSAGES.EQUIPMENT_RENTAL),
      );
      return state;

    case BOT_STATES.PLAN_WAITING_OPTION:
      await services.messaging.sendMessage(
        from,
        withNavigationHint(TWILIO_MESSSAGES.PLANS),
      );
      return state;
  }
}
