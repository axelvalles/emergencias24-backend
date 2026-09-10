import { IsUUID } from 'class-validator';

export class ImportPatientsDto {
  @IsUUID()
  companyId: string;

  @IsUUID()
  planId: string;
}
