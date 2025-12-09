import { AmbulanceWaitingMunicipalityHandler } from './ambulance/waiting-municipality.handler';
import { HomeCareWaitingDomicileConfirmationHandler } from './home-care/waiting-domicile-confirmation.handler';
import { HomeCareWaitingLocationHandler } from './home-care/waiting-location.handler';
import { HomeCareWaitingMunicipalityHandler } from './home-care/waiting-municipality.handler';
import { ImmediateAttentionWaitingLocationHandler } from './immediate-attention/waiting-location.handler';
import { LaboratoryWaitingTestHandler } from './laboratory/waiting-lab-test.handler';
import { MainMenuStartHandler } from './main-menu/start.handler';
import { WaitingMenuOptionHandler } from './main-menu/waiting-option.handler';
import { MedicalConsultationsWaitingOtherHandler } from './medical-consultations/waiting-other.handler';
import { MedicalConsultationsWaitingSpecialityHandler } from './medical-consultations/waiting-speciality.handler';
import { TelemedicineWaitingIdHandler } from './telemedicine/waiting-id.handler';
import { BotStates, StateHandler } from './types';
import { AmbulanceWaitingConfirmationHandler } from './ambulance/waiting-domicile-confirmation.handler';
import { AmbulanceWaitingLocationHandler } from './ambulance/waiting-location.handler';
import { EquipmentRentalWaitingOptionHandler } from './equipment-rental/waiting-equipment-option.handler';
import { PlanWaitingOptionHandler } from './plans/waiting-plan-option.handler';

export const stateMachine: Record<BotStates, StateHandler> = {
  // Menu Principal
  START: new MainMenuStartHandler(),
  WAITING_MENU_OPTION: new WaitingMenuOptionHandler(),
  // Atención Inmediata
  IMMEDIATE_ATTENTION_WAITING_LOCATION:
    new ImmediateAttentionWaitingLocationHandler(),
  // Telemedicina
  TELEMEDICINE_WAITING_ID: new TelemedicineWaitingIdHandler(),
  // Atención Domiciliaria
  HOME_CARE_WAITING_MUNICIPALITY: new HomeCareWaitingMunicipalityHandler(),
  HOME_CARE_WAITING_DOMICILE_CONFIRMATION:
    new HomeCareWaitingDomicileConfirmationHandler(),
  HOME_CARE_WAITING_LOCATION: new HomeCareWaitingLocationHandler(),
  // Consultas Médicas
  MEDICAL_CONSULTATIONS_WAITING_SPECIALTY:
    new MedicalConsultationsWaitingSpecialityHandler(),
  MEDICAL_CONSULTATIONS_WAITING_OTHER:
    new MedicalConsultationsWaitingOtherHandler(),
  // Exámenes de laboratorio
  LABORATORY_WAITING_TEST: new LaboratoryWaitingTestHandler(),
  // Traslados
  AMBULANCE_WAITING_MUNICIPALITY: new AmbulanceWaitingMunicipalityHandler(),
  AMBULANCE_WAITING_CONFIRMATION: new AmbulanceWaitingConfirmationHandler(),
  AMBULANCE_WAITING_LOCATION: new AmbulanceWaitingLocationHandler(),
  // Alquiler de equipos
  EQUIPMENT_RENTAL_WAITING_OPTION: new EquipmentRentalWaitingOptionHandler(),
  // Plans
  Plan_WAITING_OPTION: new PlanWaitingOptionHandler(),
};
