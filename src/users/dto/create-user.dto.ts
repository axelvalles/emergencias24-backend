import {
  ArrayMaxSize,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  phone: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID('7', { each: true })
  ambulanceUnitIds?: string[];
}
