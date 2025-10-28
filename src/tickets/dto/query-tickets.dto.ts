import {
  IsEnum,
  IsOptional,
  IsString,
  IsDateString,
  IsInt,
  Min,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceType, TicketStatus, Priority } from '../entities/ticket.entity';

export class QueryTicketsDto {
  @IsOptional()
  @IsArray()
  @IsEnum(ServiceType, { each: true })
  serviceType?: ServiceType[];

  @IsOptional()
  @IsArray()
  @IsEnum(TicketStatus, { each: true })
  status?: TicketStatus[];

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsString()
  requesterPhone?: string;

  @IsOptional()
  @IsString()
  municipality?: string;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  referenceNumber?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDateString()
  createdFrom?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDateString()
  createdTo?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
