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
  it('accepts valid env', () => {
    const parsed = envSchema.parse(validEnv);

    expect(parsed.JWT_SECRET).toBe('super-secret');
  });

  it('rejects missing JWT_SECRET', () => {
    const parsed = envSchema.safeParse({
      ...validEnv,
      JWT_SECRET: undefined,
    });

    expect(parsed.success).toBe(false);
  });
});
