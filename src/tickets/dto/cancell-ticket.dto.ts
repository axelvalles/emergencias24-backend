import { IsString } from 'class-validator';

export class CancelTicketDto {
  @IsString()
  cancellationReason: string;
}
