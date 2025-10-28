import {
  IsString,
  IsDateString,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';

export class CreatePatientDto {
  @IsNotEmpty()
  @IsString()
  first_name: string;

  @IsNotEmpty()
  @IsString()
  last_name: string;

  @IsOptional()
  @IsDateString()
  birth_date: Date;

  @IsString()
  gender: string;

  @IsString()
  document_type: string;

  @IsString()
  document_number: string;

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
  zip_code?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  secondary_phone?: string;

  @IsOptional()
  @IsString()
  emergency_contact_name?: string;

  @IsOptional()
  @IsString()
  emergency_contact_phone?: string;
}
