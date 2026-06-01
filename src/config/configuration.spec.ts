import { envSchema } from './configuration';

const validEnv = {
  NODE_ENV: 'test',
  TWILIO_ACCOUNT_SID: 'sid',
  TWILIO_AUTH_TOKEN: 'token',
  TWILIO_PHONE_NUMBER: 'whatsapp:+1234567890',
  POSTGRES_URL: 'https://postgres.example.com',
  REDIS_URL: 'https://redis.example.com',
  JWT_SECRET: 'super-secret',
  PORT: '3000',
};

describe('envSchema', () => {
  it('accepts valid env and applies throttle defaults', () => {
    const parsed = envSchema.parse(validEnv);

    expect(parsed.JWT_SECRET).toBe('super-secret');
    expect(parsed.AUTH_LOGIN_THROTTLE_TTL).toBe(60);
    expect(parsed.AUTH_LOGIN_THROTTLE_LIMIT).toBe(5);
  });

  it('rejects missing JWT_SECRET', () => {
    const parsed = envSchema.safeParse({
      ...validEnv,
      JWT_SECRET: undefined,
    });

    expect(parsed.success).toBe(false);
  });

  it('rejects non-positive throttle values', () => {
    const parsed = envSchema.safeParse({
      ...validEnv,
      AUTH_LOGIN_THROTTLE_TTL: 0,
      AUTH_LOGIN_THROTTLE_LIMIT: -1,
    });

    expect(parsed.success).toBe(false);
  });
});
