import {
  IsIn,
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsEnum,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PatientStatus } from '../entities/patient.entity';

export class QueryPatientsDto {
  @IsOptional()
  @IsString()
  q?: string = '';

  @IsOptional()
  @IsString()
  fullName?: string = '';

  @IsOptional()
  @IsString()
  documentNumber?: string = '';

  @IsOptional()
  @IsArray()
  @IsEnum(PatientStatus, { each: true })
  status?: PatientStatus[];

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
  @IsIn([
    'createdAt',
    'updatedAt',
    'firstName',
    'lastName',
    'documentNumber',
    'status',
    'fullName',
  ])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
