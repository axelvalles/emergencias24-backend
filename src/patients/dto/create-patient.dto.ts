import {
  IsString,
  IsDateString,
  IsOptional,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';
import { Gender, DocumentType } from '../entities/patient.entity';

export class CreatePatientDto {
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsOptional()
  @IsDateString()
  birthDate: Date;

  @IsEnum(Gender)
  gender: Gender;

  @IsEnum(DocumentType)
  documentType: DocumentType;

  @IsString()
  documentNumber: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  secondaryPhone?: string;

  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsString()
  medicalConditions?: string;
}
