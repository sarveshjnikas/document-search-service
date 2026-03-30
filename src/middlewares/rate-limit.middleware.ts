import { NextFunction, Request, Response } from 'express';
import { appConfig } from '../config/app.config';
import { RateLimitService } from '../services/rate-limit.service';

export function createRateLimitMiddleware(rateLimitService: RateLimitService) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/health') {
      return next();
    }

    const tenantId = req.header('x-tenant-id') || (typeof req.query.tenant === 'string' ? req.query.tenant : 'anonymous');
    const result = rateLimitService.allow(
      `tenant:${tenantId}`,
      appConfig.rateLimit.windowMs,
      appConfig.rateLimit.maxRequestsPerWindow
    );

    if (!result.allowed) {
      res.setHeader('Retry-After', Math.ceil((result.retryAfterMs ?? 0) / 1000));
      return res.status(429).json({
        error: true,
        message: 'Rate limit exceeded'
      });
    }

    return next();
  };
}
