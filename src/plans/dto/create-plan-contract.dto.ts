import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreatePlanContractDto {
  @IsUUID()
  planId: string;

  @IsUUID()
  individualPayerId: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  beneficiaryPatientIds: string[];

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
