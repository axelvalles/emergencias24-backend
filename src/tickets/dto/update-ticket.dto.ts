import { PartialType } from '@nestjs/mapped-types';
import { CreateTicketDto } from './create-ticket.dto';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TicketStatus } from '../entities/ticket.entity';
import { TICKET_OWNER_ROLE, type TicketOwnerRole } from '../ticket-owner-role';

export class UpdateTicketDto extends PartialType(CreateTicketDto) {
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsString()
  @IsUUID()
  assignedUnitId?: string;

  @IsOptional()
  @IsEnum(TICKET_OWNER_ROLE)
  currentOwnerRole?: TicketOwnerRole;

  @IsOptional()
  @Type(() => Date)
  @IsDateString()
  assignedAt?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDateString()
  completedAt?: Date;
}
