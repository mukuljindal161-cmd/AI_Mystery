import { z } from 'zod';
import { ApiError } from './errorHandler.js';
export const premiseSchema = z
  .string()
  .transform((v) => v.replace(/[\u0000-\u001f\u007f]/g, ' ').trim())
  .pipe(z.string().min(10).max(300));
export const createSchema = z
  .object({ premise: premiseSchema, difficulty: z.enum(['easy', 'medium', 'hard']) })
  .strict();
export const accuseSchema = z.object({ suspectId: z.string().regex(/^s[1-5]$/) }).strict();
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success)
      return next(
        new ApiError(
          400,
          'VALIDATION_ERROR',
          'Please check your input.',
          result.error.issues.map((i) => ({ field: i.path.join('.'), issue: i.message })),
        ),
      );
    req.body = result.data;
    next();
  };
}
export function validateId(req, res, next) {
  if (!/^[a-f\d]{24}$/i.test(req.params.id))
    return next(new ApiError(400, 'INVALID_ID', 'Invalid case ID.'));
  next();
}
