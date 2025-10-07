import { Patient } from 'src/patients/entities/patient.entity';
import { BotStates } from '../flow/state-machine.config';

export interface BotSession {
  from: string;
  lastInteraction: Date;
  previousState: BotStates;
  currentState: BotStates;
  patient: Patient | null;
}
