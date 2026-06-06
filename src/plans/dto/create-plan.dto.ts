import {
  ArrayUnique,
  IsArray,
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsUUID,
  Min,
  ValidateNested,
  IsEnum,
  Matches,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PlanBillingPeriod, PlanType, PlanStatus } from '../entities/plan.entity';
import { PlanBenefitValueType } from '../entities/plan-benefit.entity';

export class CreatePlanBenefitDto {
  @IsUUID()
  benefitId: string;

  @IsEnum(PlanBenefitValueType)
  valueType: PlanBenefitValueType;

  @ValidateIf(
    (value: CreatePlanBenefitDto) =>
      value.valueType === PlanBenefitValueType.QUANTITY,
  )
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;

  @ValidateIf(
    (value: CreatePlanBenefitDto) =>
      value.valueType === PlanBenefitValueType.QUANTITY,
  )
  @IsBoolean()
  isUnlimited: boolean;

  @ValidateIf(
    (value: CreatePlanBenefitDto) =>
      value.valueType === PlanBenefitValueType.DISCOUNT,
  )
  @IsString()
  @Matches(/^(100|\d{1,2})(\.\d{1,2})?$/, {
    message: 'discountPercentage must be between 0 and 100 with up to 2 decimals',
  })
  discountPercentage?: string;
}

export class CreatePlanDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(PlanType)
  planType: PlanType;

  @IsEnum(PlanBillingPeriod)
  billingPeriod: PlanBillingPeriod;

  @IsOptional()
  @IsEnum(PlanStatus)
  status?: PlanStatus;

  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'monthlyCost must be a valid decimal with up to 2 decimals',
  })
  monthlyCost?: string;

  @IsOptional()
  @IsString()
  benefitsNotes?: string;

  @IsArray()
  @ArrayUnique((planBenefit: CreatePlanBenefitDto) => planBenefit.benefitId)
  @ValidateNested({ each: true })
  @Type(() => CreatePlanBenefitDto)
  planBenefits: CreatePlanBenefitDto[];
}
