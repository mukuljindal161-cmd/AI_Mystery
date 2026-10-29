import 'dotenv/config';
import { z } from 'zod';

export function readEnv(input = process.env) {
  const result = z
    .object({
      PORT: z.coerce.number().int().min(1).max(65535).default(5000),
      MONGODB_URI: z.string().min(1),
      GEMINI_API_KEY: z.string().min(1),
      GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
      CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
      NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
      MOCK_AI: z
        .enum(['true', 'false'])
        .default('false')
        .transform((v) => v === 'true'),
      TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),
    })
    .safeParse(input);
  if (!result.success)
    throw new Error(
      `Invalid environment: ${result.error.issues.map((i) => i.path.join('.')).join(', ')}. See server/.env.example.`,
    );
  return result.data;
}
