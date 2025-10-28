import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ServiceType, Priority } from '../entities/ticket.entity';

export class CreateTicketDto {
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority = Priority.MEDIUM;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsString()
  requesterPhone: string;

  @IsOptional()
  @IsString()
  requesterName?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  municipality?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  speciality?: string;
}
