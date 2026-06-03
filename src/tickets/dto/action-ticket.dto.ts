import { IsOptional, IsString } from 'class-validator';

export class ActionTicketDto {
  @IsOptional()
  @IsString()
  comment?: string;
}
