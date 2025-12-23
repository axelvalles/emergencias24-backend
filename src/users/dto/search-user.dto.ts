import { IsOptional, IsString, IsEnum, IsInt, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../entities/user.entity';

export class SearchUserDto {
  @IsOptional()
  @IsString()
  term?: string;

  @IsOptional()
  @IsEnum(UserRole, { each: true })
  role?: UserRole | UserRole[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
