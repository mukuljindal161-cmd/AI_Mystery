import 'dotenv/config';
import { z } from 'zod';
import { isIP } from 'node:net';

export function readEnv(input = process.env) {
  const result = z
    .object({
      PORT: z.coerce.number().int().min(1).max(65535).default(5000),
      MONGODB_URI: z.string().min(1),
      GEMINI_API_KEY: z.string().min(1),
      GEMINI_MODEL: z.string().default('gemini-3.1-flash-lite'),
      CLIENT_ORIGIN: z
        .string()
        .url()
        .default('http://localhost:5173')
        .refine((value) => {
          const url = new URL(value);
          return (
            ['http:', 'https:'].includes(url.protocol) &&
            !url.username &&
            !url.password &&
            url.pathname === '/' &&
            !url.search &&
            !url.hash
          );
        }, 'Must be a browser origin without a path, query, or credentials')
        .transform((value) => new URL(value).origin),
      DNS_SERVERS: z
        .string()
        .default('')
        .transform((value) =>
          value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        )
        .refine(
          (values) => values.every((value) => isIP(value)),
          'Use comma-separated DNS IP addresses',
        ),
      NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
      MOCK_AI: z
        .enum(['true', 'false'])
        .default('false')
        .transform((v) => v === 'true'),
      TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),
    })
    .superRefine((env, ctx) => {
      if (
        env.NODE_ENV === 'production' &&
        (!input.CLIENT_ORIGIN ||
          !env.CLIENT_ORIGIN.startsWith('https://') ||
          ['localhost', '127.0.0.1', '[::1]'].includes(new URL(env.CLIENT_ORIGIN).hostname))
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['CLIENT_ORIGIN'],
          message: 'Set the HTTPS frontend origin for production',
        });
      }
    })
    .safeParse(input);
  if (!result.success)
    throw new Error(
      `Invalid environment: ${result.error.issues.map((i) => i.path.join('.')).join(', ')}. See server/.env.example.`,
    );
  return result.data;
}
