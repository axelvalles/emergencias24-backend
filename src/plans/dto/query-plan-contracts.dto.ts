import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { PlanContractStatus } from '../entities/plan-contract.entity';

export class QueryPlanContractsDto {
  @IsOptional()
  @IsUUID()
  planId?: string;

  @IsOptional()
  @IsUUID()
  individualPayerId?: string;

  @IsOptional()
  @IsEnum(PlanContractStatus)
  status?: PlanContractStatus;

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
}
