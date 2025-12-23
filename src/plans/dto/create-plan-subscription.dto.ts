import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import {
  PlanSubscriptionStatus,
  PayerType,
} from '../entities/plan-subscription.entity';

export class CreatePlanSubscriptionDto {
  @IsString()
  patientId: string;

  @IsString()
  planId: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsEnum(PlanSubscriptionStatus)
  status?: PlanSubscriptionStatus;

  @IsEnum(PayerType)
  payerType: PayerType;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
