import { MessagingService } from 'src/shared/messaging/messaging.service';
import { SessionStoreService } from '../session-store.service';
import { PatientsService } from 'src/patients/patients.service';
import { TicketsService } from 'src/tickets/tickets.service';
import { BotSession } from '../interfaces/bot-session.interface';
import { MunicipalityPricingService } from 'src/municipality-pricing/municipality-pricing.service';

export const BOT_STATES = {
  START: 'START',
  WAITING_MENU_OPTION: 'WAITING_MENU_OPTION',
  IMMEDIATE_ATTENTION_WAITING_LOCATION: 'IMMEDIATE_ATTENTION_WAITING_LOCATION',
  TELEMEDICINE_WAITING_ID: 'TELEMEDICINE_WAITING_ID',
  HOME_CARE_WAITING_MUNICIPALITY: 'HOME_CARE_WAITING_MUNICIPALITY',
  HOME_CARE_WAITING_DOMICILE_CONFIRMATION:
    'HOME_CARE_WAITING_DOMICILE_CONFIRMATION',
  HOME_CARE_WAITING_LOCATION: 'HOME_CARE_WAITING_LOCATION',
  MEDICAL_CONSULTATIONS_WAITING_SPECIALTY:
    'MEDICAL_CONSULTATIONS_WAITING_SPECIALTY',
  MEDICAL_CONSULTATIONS_WAITING_OTHER: 'MEDICAL_CONSULTATIONS_WAITING_OTHER',
  LABORATORY_WAITING_TEST: 'LABORATORY_WAITING_TEST',
  AMBULANCE_WAITING_MUNICIPALITY: 'AMBULANCE_WAITING_MUNICIPALITY',
  AMBULANCE_WAITING_CONFIRMATION: 'AMBULANCE_WAITING_CONFIRMATION',
  AMBULANCE_WAITING_LOCATION: 'AMBULANCE_WAITING_LOCATION',
  EQUIPMENT_RENTAL_WAITING_OPTION: 'EQUIPMENT_RENTAL_WAITING_OPTION',
  PLAN_WAITING_OPTION: 'Plan_WAITING_OPTION',
} as const;

export type BotStates = (typeof BOT_STATES)[keyof typeof BOT_STATES];

export type Context = BotSession;

export type Response = {
  nextState: BotStates;
  lastInteraction: string;
  currentState: BotStates;
};

export type Services = {
  messaging: MessagingService;
  sessionStore: SessionStoreService;
  patientsService: PatientsService;
  ticketsService: TicketsService;
  municipalityPricingService: MunicipalityPricingService;
};

export type MessagingInput = {
  from: string;
  body: string;
  profileName: string;
  location: { latitude: string; longitude: string } | null;
};

export interface StateHandler {
  handle(
    messagingResponse: MessagingInput,
    context: Context,
    services: Services,
  ): Promise<Response>;
}
