import { Router } from 'express';
import { z } from 'zod';
import { asyncRoute, ApiError } from '../middleware/errorHandler.js';
import { validate, validateId, createSchema, accuseSchema } from '../middleware/validate.js';
import {
  toPublicCase,
  toResult,
  publicClue,
  progressOf,
  evidenceScore,
  completeCase,
} from '../services/caseService.js';
export function casesRouter({ repository, generate, creationLimiter }) {
  const router = Router();
  router.post(
    '/',
    creationLimiter,
    validate(createSchema),
    asyncRoute(async (req, res) => {
      const generated = await generate(req.body);
      const doc = await repository.create({
        ...generated,
        ...req.body,
        progress: { hintsUsed: 0 },
        status: 'active',
      });
      res.status(201).json({ case: toPublicCase(doc) });
    }),
  );
  router.use('/:id', validateId);
  router.get(
    '/:id',
    asyncRoute(async (req, res) =>
      res.json({ case: toPublicCase(await repository.get(req.params.id)) }),
    ),
  );
  router.post(
    '/:id/clues/:clueId/discover',
    validate(z.object({}).strict()),
    asyncRoute(async (req, res) => {
      if (!/^c[1-9]$/.test(req.params.clueId))
        throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid clue ID.');
      const doc = await repository.mutate(req.params.id, (doc) => {
        const clue = doc.clues.find((c) => c.id === req.params.clueId);
        if (!clue) throw new ApiError(404, 'CLUE_NOT_FOUND', 'Clue not found.');
        if (!clue.discovered) {
          clue.discovered = true;
          clue.discoveredAt = new Date();
        }
      });
      res.json({
        clue: publicClue(doc.clues.find((c) => c.id === req.params.clueId)),
        progress: progressOf(doc),
        score: evidenceScore(doc),
      });
    }),
  );
  router.post(
    '/:id/hints',
    validate(z.object({}).strict()),
    asyncRoute(async (req, res) => {
      const doc = await repository.mutate(req.params.id, (doc) => {
        if (doc.progress.hintsUsed >= doc.hints.length)
          throw new ApiError(409, 'NO_HINTS_REMAINING', 'No hints remaining. Trust your evidence.');
        doc.progress.hintsUsed++;
      });
      const used = doc.progress.hintsUsed;
      res.json({
        hint: { index: used - 1, text: doc.hints[used - 1].text },
        hints: { total: doc.hints.length, used, remaining: doc.hints.length - used },
        score: evidenceScore(doc),
      });
    }),
  );
  router.post(
    '/:id/accuse',
    validate(accuseSchema),
    asyncRoute(async (req, res) => {
      const doc = await repository.mutate(req.params.id, (doc) =>
        completeCase(doc, req.body.suspectId),
      );
      res.json({ result: toResult(doc) });
    }),
  );
  router.get(
    '/:id/result',
    asyncRoute(async (req, res) =>
      res.json({ result: toResult(await repository.get(req.params.id)) }),
    ),
  );
  return router;
}
