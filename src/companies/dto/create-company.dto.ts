import { IsString, IsEmail } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  name: string;

  @IsString()
  taxId: string;

  @IsEmail()
  contactEmail: string;

  @IsString()
  contactPhone: string;
}
