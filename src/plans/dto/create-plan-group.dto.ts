import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { PlanGroupType } from '../entities/plan-group.entity';

export class CreatePlanGroupDto {
  @IsUUID()
  plan_id: string;

  @IsEnum(PlanGroupType)
  group_type: PlanGroupType;

  @IsOptional()
  @IsUUID()
  company_id?: string;

  @IsOptional()
  @IsUUID()
  holder_id?: string;

  @IsString()
  entity_name: string;

  @IsDateString()
  start_date: Date;

  @IsOptional()
  @IsDateString()
  end_date?: Date;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
