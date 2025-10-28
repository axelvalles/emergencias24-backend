export interface IMessagingProvider {
  sendMessage(to: string, message: string): Promise<void>;
  sendTemplate(
    to: string,
    templateName: string,
    params?: Record<string, string | number>,
  ): Promise<void>;
}
