import { IsString, IsEnum, IsOptional, IsJSON } from 'class-validator';

export class TwilioIncomingMessageDto {
  @IsString()
  SmsMessageSid: string;

  @IsString()
  NumMedia: string;

  @IsString()
  ProfileName: string;

  @IsEnum(['text', 'image', 'video', 'audio', 'document'], {
    message: 'MessageType must be a valid Twilio message type',
  })
  @IsOptional()
  MessageType?: string;

  @IsString()
  SmsSid: string;

  @IsString()
  WaId: string;

  @IsEnum(['received', 'sent', 'failed'], {
    message: 'SmsStatus must be a valid Twilio SMS status',
  })
  @IsOptional()
  SmsStatus?: string;

  @IsString()
  Body: string;

  @IsString()
  To: string;

  @IsString()
  NumSegments: string;

  @IsString()
  ReferralNumMedia: string;

  @IsString()
  MessageSid: string;

  @IsString()
  AccountSid: string;

  @IsJSON()
  ChannelMetadata: string; // Se envía como string JSON

  @IsString()
  From: string;

  @IsString()
  ApiVersion: string;
}
