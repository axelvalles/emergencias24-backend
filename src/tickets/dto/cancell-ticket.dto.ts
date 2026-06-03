import { IsString, IsOptional } from 'class-validator';

export class CancelTicketDto {
  @IsOptional()
  @IsString()
  comment?: string;
}
