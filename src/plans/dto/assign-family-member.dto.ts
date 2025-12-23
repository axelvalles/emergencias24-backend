import { IsString, IsUUID, IsNotEmpty } from 'class-validator';

export class AssignFamilyMemberDto {
  /**
   * The ID of the main subscription (the family plan owner's subscription)
   */
  @IsUUID()
  @IsString()
  subscriptionId: string;

  /**
   * The document number of the patient to add as a family member
   */
  @IsString()
  @IsNotEmpty()
  familyMemberDocumentNumber: string;
}
