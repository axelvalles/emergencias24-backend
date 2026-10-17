import { IsUUID } from 'class-validator';

export class AddContractBeneficiaryDto {
  @IsUUID()
  patientId: string;
}
