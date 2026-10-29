import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { casesRouter } from './routes/cases.js';
import { errorHandler, ApiError } from './middleware/errorHandler.js';
import { caseRepository } from './services/caseRepository.js';
import { createGenerator } from './services/geminiService.js';
export function createApp(
  env,
  { repository = caseRepository, generate = createGenerator(env), rateLimits = true } = {},
) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY || false);
  app.use(helmet(), cors({ origin: env.CLIENT_ORIGIN }), express.json({ limit: '10kb' }));
  const limiter = (limit, windowMs) =>
    rateLimits
      ? rateLimit({
          limit,
          windowMs,
          standardHeaders: 'draft-7',
          legacyHeaders: false,
          handler: (req, res, next) =>
            next(
              new ApiError(
                429,
                'RATE_LIMITED',
                'The detective agency is busy. Please wait a moment and try again.',
              ),
            ),
        })
      : (req, res, next) => next();
  const generalLimiter = limiter(100, 15 * 60 * 1000);
  app.use('/api', (req, res, next) =>
    req.method === 'POST' && /^\/cases\/?$/.test(req.path)
      ? next()
      : generalLimiter(req, res, next),
  );
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use(
    '/api/cases',
    casesRouter({ repository, generate, creationLimiter: limiter(5, 10 * 60 * 1000) }),
  );
  app.use((req, res, next) => next(new ApiError(404, 'NOT_FOUND', 'Endpoint not found.')));
  app.use(errorHandler);
  return app;
}
