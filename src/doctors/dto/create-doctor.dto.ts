import {
  IsString,
  IsOptional,
  IsInt,
  IsDecimal,
  IsNotEmpty,
} from 'class-validator';

export class CreateDoctorDto {
  @IsNotEmpty()
  @IsString()
  first_name: string;

  @IsNotEmpty()
  @IsString()
  last_name: string;

  @IsNotEmpty()
  @IsString()
  license_number: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  qualifications?: string;

  @IsOptional()
  @IsInt()
  years_of_experience?: number;

  @IsOptional()
  @IsString()
  office_address?: string;

  @IsOptional()
  consultation_hours_start?: string;

  @IsOptional()
  consultation_hours_end?: string;

  @IsOptional()
  @IsDecimal()
  consultation_fee?: number;
}
