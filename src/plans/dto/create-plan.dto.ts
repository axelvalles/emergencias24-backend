import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PlanType, PlanStatus } from '../entities/plan.entity';

export class PlanBenefitsDto {
  @IsBoolean()
  consultations: boolean;

  @IsBoolean()
  emergencyCoverage: boolean;

  @IsBoolean()
  dental: boolean;

  @IsOptional()
  @IsBoolean()
  optometry?: boolean;

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
  @IsNumber()
  monthlyCost?: number;
}
