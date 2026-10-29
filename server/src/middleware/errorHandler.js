export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    Object.assign(this, { status, code, details });
  }
}
export const asyncRoute = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  let error = err;
  if (err.type === 'entity.parse.failed')
    error = new ApiError(400, 'VALIDATION_ERROR', 'Request body must be valid JSON.');
  if (err.type === 'entity.too.large')
    error = new ApiError(413, 'VALIDATION_ERROR', 'Request body is too large.');
  if (!(error instanceof ApiError)) {
    console.error('Request failed:', err.name);
    error = new ApiError(500, 'INTERNAL_ERROR', 'Something went wrong. Please try again.');
  }
  res
    .status(error.status)
    .json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    });
}
