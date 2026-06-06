import { MessagingService } from 'src/shared/messaging/messaging.service';
import { SessionStoreService } from '../session-store.service';
import { PatientsService } from 'src/patients/patients.service';
import { TicketsService } from 'src/tickets/tickets.service';
import { BotSession } from '../interfaces/bot-session.interface';
import { MunicipalityPricingService } from 'src/municipality-pricing/municipality-pricing.service';

export type BotStates =
  // Menu principal
  | 'START'
  | 'WAITING_MENU_OPTION'
  //  Atención Inmediata
  | 'IMMEDIATE_ATTENTION_WAITING_LOCATION'
  // Telemedicina
  | 'TELEMEDICINE_WAITING_ID'
  // Atención Domiciliaria
  | 'HOME_CARE_WAITING_MUNICIPALITY'
  | 'HOME_CARE_WAITING_DOMICILE_CONFIRMATION'
  | 'HOME_CARE_WAITING_LOCATION'
  // Consultas Médicas
  | 'MEDICAL_CONSULTATIONS_WAITING_SPECIALTY'
  | 'MEDICAL_CONSULTATIONS_WAITING_OTHER'
  // Laboratorios Clínicos
  | 'LABORATORY_WAITING_TEST'
  // Traslados
  | 'AMBULANCE_WAITING_MUNICIPALITY'
  | 'AMBULANCE_WAITING_CONFIRMATION'
  | 'AMBULANCE_WAITING_LOCATION'
  // Alquiler de equipos
  | 'EQUIPMENT_RENTAL_WAITING_OPTION'
  // Planes de suscripción
  | 'Plan_WAITING_OPTION';

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
