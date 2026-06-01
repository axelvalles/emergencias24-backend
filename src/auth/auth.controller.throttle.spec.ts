import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController login throttling', () => {
  let app: INestApplication;
  let authService: { login: jest.Mock };

  beforeEach(async () => {
    authService = {
      login: jest.fn().mockResolvedValue({ accessToken: 'token' }),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            ttl: 60_000,
            limit: 100,
          },
        ]),
      ],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 429 when login threshold is exceeded', async () => {
    const payload = {
      username: 'user@example.com',
      password: 'password',
    };

    await request(app.getHttpServer())
      .post('/auth/login')
      .send(payload)
      .expect(200);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send(payload)
      .expect(200);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send(payload)
      .expect(429);
  });

  it('allows login requests while under threshold', async () => {
    const payload = {
      username: 'second-user@example.com',
      password: 'password',
    };

    await request(app.getHttpServer())
      .post('/auth/login')
      .send(payload)
      .expect(200);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send(payload)
      .expect(200);

    expect(authService.login).toHaveBeenCalledTimes(2);
  });
});
