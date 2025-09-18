import { Client } from 'src/clients/entities/client.entity';
import { FlowState } from './flows.enum';

export interface BotSession {
  userId: string;
  state: FlowState;
  lastInteraction: Date;
  clientData?: Client;
  nextState?: FlowState;
}
