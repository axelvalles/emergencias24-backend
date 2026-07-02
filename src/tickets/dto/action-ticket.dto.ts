import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { TICKET_OWNER_ROLE, type TicketOwnerRole } from '../ticket-owner-role';

export class ActionTicketDto {
  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsEnum(TICKET_OWNER_ROLE)
  ownerRole?: TicketOwnerRole;

  @IsOptional()
  @IsUUID()
  ambulanceUnitId?: string;
}
