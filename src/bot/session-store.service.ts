import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { BotSession } from './interfaces/bot-session.interface';
import { Patient } from 'src/patients/entities/patient.entity';

@Injectable()
export class SessionStoreService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async getSession(from: string): Promise<BotSession> {
    const data = await this.redis.get(`session:${from}`);

    if (!data) {
      return {
        currentState: 'START',
        from: from,
        lastInteraction: new Date().toISOString(),
        previousState: 'START',
        patient: null,
      };
    }

    return JSON.parse(data) as BotSession;
  }

  async setSession(from: string, session: BotSession): Promise<void> {
    await this.redis.set(
      `session:${from}`,
      JSON.stringify(session),
      'EX',
      60 * 30,
    );
  }

  async setPatient(from: string, patient: Patient | null): Promise<void> {
    const session = await this.getSession(from);
    session.patient = patient;
    await this.setSession(from, session);
  }

  async clearSession(from: string): Promise<void> {
    await this.redis.del(`session:${from}`);
  }
}
