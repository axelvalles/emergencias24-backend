import { IsOptional, IsString, ValidateIf } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsString()
  @ValidateIf(
    (o: { password?: string | null }) =>
      o.password !== undefined && o.password !== null && o.password !== '',
  )
  currentPassword?: string;
}
