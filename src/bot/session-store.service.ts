import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { BotSession } from './interfaces/bot-session.interface';
import { Patient } from 'src/patients/entities/patient.entity';
import { BotStates } from './state-machine/types';

export const SESSION_TTL_SECONDS = 60 * 30;

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
      SESSION_TTL_SECONDS,
    );
  }

  async setPatient(from: string, patient: Patient | null): Promise<void> {
    const session = await this.getSession(from);
    session.patient = patient;
    await this.setSession(from, session);
  }

  async setMunicipality(from: string, municipality: string): Promise<void> {
    const session = await this.getSession(from);
    session.municipality = municipality;
    await this.setSession(from, session);
  }

  async setSpeciality(from: string, speciality: string): Promise<void> {
    const session = await this.getSession(from);
    session.speciality = speciality;
    await this.setSession(from, session);
  }

  async clearSession(from: string): Promise<void> {
    await this.redis.del(`session:${from}`);
  }

  async setCurentState(from: string, state: BotStates): Promise<void> {
    const session = await this.getSession(from);
    session.previousState = session.currentState;
    session.currentState = state;
    session.lastInteraction = new Date().toISOString();
    await this.setSession(from, session);
  }

  async transitionToState(from: string, state: BotStates): Promise<void> {
    await this.setCurentState(from, state);
  }
}
