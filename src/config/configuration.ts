import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Twilio
  TWILIO_ACCOUNT_SID: z.string().min(1),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  TWILIO_PHONE_NUMBER: z.string().regex(/^whatsapp:\+\d+$/, 'Formato inválido'),

  // DB
  POSTGRES_URL: z.url(),

  // Redis
  REDIS_URL: z.url(),

  // Auth
  JWT_SECRET: z.string().trim().min(1, 'JWT_SECRET is required'),

  // Auth throttle
  AUTH_LOGIN_THROTTLE_TTL: z.coerce.number().int().positive().default(60),
  AUTH_LOGIN_THROTTLE_LIMIT: z.coerce.number().int().positive().default(5),
  API_THROTTLE_TTL: z.coerce.number().int().positive().default(60),
  API_THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),
  BULK_THROTTLE_TTL: z.coerce.number().int().positive().default(60),
  BULK_THROTTLE_LIMIT: z.coerce.number().int().positive().default(5),

  // Otros
  PORT: z.coerce.number().default(3000),
  CORS_ORIGINS: z.string().optional(),
});

export type EnvVars = z.infer<typeof envSchema>;
