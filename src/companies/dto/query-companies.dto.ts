import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CompanyStatus } from '../entities/company.entity';

export class QueryCompaniesDto {
  @IsOptional()
  @IsString()
  name?: string = '';

  @IsOptional()
  @IsString()
  taxId?: string = '';

  @IsOptional()
  @IsString()
  contactEmail?: string = '';

  @IsOptional()
  @IsArray()
  @IsEnum(CompanyStatus, { each: true })
  status?: CompanyStatus;

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
