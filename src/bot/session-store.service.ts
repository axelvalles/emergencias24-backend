import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { BotSession } from './interfaces/bot-session.interface';
import { FlowState } from './interfaces/flows.enum';

@Injectable()
export class SessionStoreService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async getSession(userId: string): Promise<BotSession> {
    const data = await this.redis.get(`session:${userId}`);

    if (!data) {
      const session = {
        userId,
        state: FlowState.WELCOME,
        lastInteraction: new Date(),
      };

      await this.setSession(userId, session);

      return session;
    }

    return JSON.parse(data) as BotSession;
  }

  async setSession(userId: string, session: BotSession) {
    await this.redis.set(
      `session:${userId}`,
      JSON.stringify(session),
      'EX',
      60 * 30,
    ); // 30 min
  }

  async clearSession(userId: string) {
    await this.redis.del(`session:${userId}`);
  }
}
