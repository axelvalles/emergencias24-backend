import { IsString, IsOptional } from 'class-validator';

export class TwilioWebhookDto {
  @IsString()
  From: string;

  @IsString()
  To: string;

  @IsString()
  Body: string;

  @IsOptional()
  @IsString()
  MessageType?: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location';

  @IsOptional()
  @IsString()
  Latitude?: string;

  @IsOptional()
  @IsString()
  Longitude?: string;
}
