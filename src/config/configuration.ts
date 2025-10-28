import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Twilio
  TWILIO_ACCOUNT_SID: z.string().min(1),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  TWILIO_PHONE_NUMBER: z.string().regex(/^whatsapp:\+\d+$/, 'Formato inválido'),

  // Meta
  META_ACCESS_TOKEN: z.string().min(1),
  META_PHONE_NUMBER_ID: z.string().min(1),
  WHATSAPP_VERIFY_TOKEN: z.string().min(1),

  // DB
  POSTGRES_URL: z.url(),

  // Redis
  REDIS_URL: z.url(),

  // Auth
  JWT_SECRET: z.string().min(5),

  // Otros
  PORT: z.coerce.number().default(3000),
});

export type EnvVars = z.infer<typeof envSchema>;
