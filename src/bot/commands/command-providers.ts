import { InmediateAttentionCommand } from './inmediate-attention.command';
import { CommandRegistry } from './command-registry';
import { ValidateAffiliationCommand } from './validate-affiliation.command';
import { MainMenuCommand } from './main-menu.command';
import { WelcomeCommand } from './welcome.command';
import { HomeCareCommand } from './home-care.command';

export const commandProviders = [
  //
  WelcomeCommand,
  MainMenuCommand,
  // opcion de atencion inmediata
  InmediateAttentionCommand,
  // opcion telemedicina
  ValidateAffiliationCommand,
  // opcion atencion domiciliaria
  HomeCareCommand,
  //
  CommandRegistry,
];
