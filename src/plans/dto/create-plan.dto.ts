import {
  IsString,
  IsOptional,
  IsBoolean,
  ValidateNested,
  IsEnum,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PlanType, PlanStatus } from '../entities/plan.entity';

export class PlanBenefitsDto {
  @IsBoolean()
  telemedicine: boolean;

  @IsBoolean()
  medicationDelivery: boolean;

  @IsBoolean()
  ambulanceTransfer: boolean;

  @IsBoolean()
  homeCare: boolean;

  @IsBoolean()
  workplaceCare: boolean;

  @IsBoolean()
  emergencyRoom: boolean;

  @IsBoolean()
  specializedConsultations: boolean;

  @IsBoolean()
  labTests: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreatePlanDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @ValidateNested()
  @Type(() => PlanBenefitsDto)
  benefits: PlanBenefitsDto;

  @IsEnum(PlanType)
  planType: PlanType;

  @IsOptional()
  @IsEnum(PlanStatus)
  status?: PlanStatus;

  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'monthlyCost must be a valid decimal with up to 2 decimals',
  })
  monthlyCost?: string;
}
