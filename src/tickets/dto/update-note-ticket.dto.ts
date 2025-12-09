import { IsString } from 'class-validator';

export class UpdateNoteTicketDto {
  @IsString()
  note: string;
}
