import { NextFunction, Request, Response } from 'express';
import { HttpError } from 'routing-controllers';

export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction): Response {
  if (res.headersSent) {
    return res;
  }

  const message = err instanceof Error ? err.message : 'Unexpected error';
  const statusCode = err instanceof HttpError ? err.httpCode : 500;

  return res.status(statusCode).json({
    error: true,
    statusCode,
    message
  });
}
