import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { PlanType, PlanStatus, GroupCategory } from '../entities/plan.entity';

export class CreatePlanDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(PlanType)
  plan_type: PlanType;

  @IsOptional()
  @IsEnum(GroupCategory)
  group_category?: GroupCategory;

  @IsOptional()
  @IsNumber()
  min_members?: number;

  @IsObject()
  benefits: object;

  @IsOptional()
  @IsNumber()
  monthly_cost?: number;

  @IsOptional()
  @IsNumber()
  annual_cost?: number;

  @IsOptional()
  @IsDateString()
  valid_from?: Date;

  @IsOptional()
  @IsDateString()
  valid_until?: Date;
}
