import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { DocumentType } from '../../patients/entities/patient.entity';

export class CreateIndividualPayerDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, {
    message: 'firstName must contain a non-whitespace character',
  })
  @MaxLength(100)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, {
    message: 'lastName must contain a non-whitespace character',
  })
  @MaxLength(100)
  lastName: string;

  @IsEnum(DocumentType)
  documentType: DocumentType;

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, {
    message: 'documentNumber must contain a non-whitespace character',
  })
  @MaxLength(50)
  documentNumber: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsUUID()
  linkedPatientId?: string | null;
}
