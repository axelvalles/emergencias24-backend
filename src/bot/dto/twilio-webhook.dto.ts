import { IsIn, IsOptional, IsString } from 'class-validator';

export class TwilioIncomingMessageDto {
  @IsString()
  SmsMessageSid!: string;

  @IsOptional()
  @IsString()
  NumMedia?: string;

  @IsOptional()
  @IsString()
  ProfileName?: string;

  @IsIn(['text', 'interactive', 'location', 'image', 'video', 'audio', 'voice'])
  MessageType?: string;

  @IsString()
  SmsSid!: string;

  @IsString()
  WaId!: string;

  @IsOptional()
  SmsStatus?: string;

  @IsOptional()
  @IsString()
  Body?: string;

  @IsString()
  To!: string;

  @IsOptional()
  @IsString()
  NumSegments?: string;

  @IsOptional()
  @IsString()
  ReferralNumMedia?: string;

  @IsString()
  MessageSid!: string;

  @IsString()
  AccountSid!: string;

  @IsOptional()
  @IsString()
  ChannelMetadata?: string;

  @IsString()
  From!: string;

  @IsOptional()
  @IsString()
  ApiVersion?: string;

  @IsOptional()
  @IsString()
  Latitude?: string;

  @IsOptional()
  @IsString()
  Longitude?: string;

  @IsOptional()
  @IsString()
  MediaUrl0?: string;

  @IsOptional()
  @IsString()
  MediaContentType0?: string;

  @IsOptional()
  @IsString()
  ListId?: string;

  @IsOptional()
  @IsString()
  ListTitle?: string;

  @IsOptional()
  @IsString()
  OriginalRepliedMessageSid?: string;
}

export class TwilioStatusCallbackDto {
  @IsString()
  MessageSid!: string;

  @IsOptional()
  @IsString()
  SmsSid?: string;

  @IsOptional()
  @IsString()
  MessageStatus?: string;

  @IsOptional()
  @IsString()
  SmsStatus?: string;

  @IsOptional()
  @IsString()
  ErrorCode?: string;

  @IsOptional()
  @IsString()
  ErrorMessage?: string;

  @IsOptional()
  @IsString()
  To?: string;

  @IsOptional()
  @IsString()
  From?: string;

  @IsOptional()
  @IsString()
  AccountSid?: string;
}
