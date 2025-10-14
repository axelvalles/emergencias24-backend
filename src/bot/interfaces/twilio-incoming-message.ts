export interface TwilioIncomingMessage {
  SmsMessageSid: string;
  SmsSid: string;
  MessageSid: string;
  AccountSid: string;
  Body: string;
  From: string;
  To: string;
  WaId: string;
  ProfileName?: string;
  MessageType?: 'text' | 'interactive';
  NumMedia?: string;
  ListId?: string;
  ListTitle?: string;
  ListDescription?: string;
  ChannelMetadata?: string;
  ApiVersion?: string;
  [key: string]: any; // <-- permite campos nuevos sin romper el tipado
}
