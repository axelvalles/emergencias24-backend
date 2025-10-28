import { PartialType } from '@nestjs/mapped-types';
import { CreateTicketDto } from './create-ticket.dto';
import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { TicketStatus } from '../entities/ticket.entity';

export class UpdateTicketDto extends PartialType(CreateTicketDto) {
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDateString()
  assignedAt?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDateString()
  completedAt?: Date;
}
