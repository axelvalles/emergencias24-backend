import { IsEnum } from 'class-validator';
import { PatientStatus } from '../entities/patient.entity';

export class UpdatePatientStatusDto {
  @IsEnum(PatientStatus)
  status: PatientStatus;
}
