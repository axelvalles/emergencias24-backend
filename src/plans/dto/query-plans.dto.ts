import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PlanStatus, PlanType } from '../entities/plan.entity';

export class QueryPlansDto {
  @IsOptional()
  @IsString()
  name?: string = '';

  @IsOptional()
  @IsString()
  description?: string = '';

  @IsOptional()
  @IsArray()
  @IsEnum(PlanStatus, { each: true })
  status?: PlanStatus[];

  @IsOptional()
  @IsArray()
  @IsEnum(PlanType, { each: true })
  planType?: PlanType[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  monthlyCostMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  monthlyCostMax?: number;

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
