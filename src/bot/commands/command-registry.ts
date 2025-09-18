import { Injectable } from '@nestjs/common';
import { ChatCommand } from '../interfaces/chat-command.interface';
import { FlowState } from '../interfaces/flows.enum';
import { MainMenuCommand } from './main-menu.command';
import { InmediateAttentionCommand } from './inmediate-attention.command';
import { ValidateAffiliationCommand } from './validate-affiliation.command';
import { WelcomeCommand } from './welcome.command';
import { HomeCareCommand } from './home-care.command';

@Injectable()
export class CommandRegistry {
  private commands: Record<string, ChatCommand>;

  constructor(
    welcome: WelcomeCommand,
    mainMenu: MainMenuCommand,
    // opcion de atencion inmediata
    inmediateAttention: InmediateAttentionCommand,
    // opcion telemedicina
    validateAffiliation: ValidateAffiliationCommand,
    // opcion atencion domiciliaria
    homeCare: HomeCareCommand,
  ) {
    this.commands = {
      // Mostrar menu principal
      [FlowState.WELCOME]: welcome,
      // Validar Respuesta del menu principal
      [FlowState.WAITING_MAIN_MENU]: mainMenu,
      // Opcion de atencion inmediata
      [FlowState.IMMEDIATE_ATTENTION_ASK_LOCATION]: inmediateAttention,
      // Opcion de telemedicina
      [FlowState.TELEMEDICINE_ASK_ID]: validateAffiliation,
      // Opcion de atencion domiciliaria
      [FlowState.HOME_CARE_ASK_CITY]: homeCare,
    };
  }

  getCommand(state: string): ChatCommand {
    return this.commands[state] ?? null;
  }
}
