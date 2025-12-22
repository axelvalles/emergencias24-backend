import { IsString, IsNotEmpty } from 'class-validator';

export class ValidateFamilyMemberDto {
  /**
   * The document number of the person to validate
   */
  @IsString()
  @IsNotEmpty()
  documentNumber: string;
}

export class ValidateFamilyMemberResponse {
  /**
   * Whether the person is eligible to be a family member
   */
  isEligible: boolean;

  /**
   * The patient information if found
   */
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    documentNumber: string;
    documentType: string;
  };

  /**
   * Reason why the person is not eligible (if not eligible)
   */
  reason?: string;

  /**
   * Details about existing family plan subscriptions (if any)
   */
  existingSubscriptions?: {
    id: string;
    planName: string;
    role: string;
    status: string;
  }[];
}
