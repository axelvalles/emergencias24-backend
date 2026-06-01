import {
  IsIn,
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsArray,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole, UserStatus } from '../entities/user.entity';

export class QueryUserDto {
  @IsOptional()
  @IsString()
  q?: string = '';

  @IsOptional()
  @IsString()
  fullName?: string = '';

  @IsOptional()
  @IsString()
  email?: string = '';

  @IsOptional()
  @IsString()
  phone?: string = '';

  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  role?: UserRole[];

  @IsOptional()
  @IsArray()
  @IsEnum(UserStatus, { each: true })
  status?: UserStatus[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsIn([
    'createdAt',
    'updatedAt',
    'firstName',
    'lastName',
    'email',
    'role',
    'status',
    'fullName',
  ])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
