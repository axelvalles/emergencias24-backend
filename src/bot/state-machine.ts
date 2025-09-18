import { FlowState } from './interfaces/flows.enum';

type TransitionTable = {
  [key in FlowState]?: FlowState[];
};

// Allowed transitions
export const stateTransitions: TransitionTable = {
  [FlowState.WELCOME]: [FlowState.WAITING_MAIN_MENU],
  [FlowState.WAITING_MAIN_MENU]: [
    FlowState.IMMEDIATE_ATTENTION_ASK_LOCATION,
    FlowState.TELEMEDICINE_ASK_ID,
    FlowState.HOME_CARE_ASK_CITY,
    FlowState.CONSULTATION_ASK_SPECIALTY,
    FlowState.LAB_ASK_TESTS,
    FlowState.AMBULANCE_ASK_CITY,
    FlowState.PHARMACY_REDIRECT,
    FlowState.EQUIPMENT_ASK_ITEM,
    FlowState.PLANS_SHOW,
  ],
  [FlowState.IMMEDIATE_ATTENTION_ASK_LOCATION]: [FlowState.END],
  [FlowState.TELEMEDICINE_ASK_ID]: [FlowState.END],
  [FlowState.HOME_CARE_ASK_CITY]: [FlowState.END],
};
