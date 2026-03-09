import { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { UnauthorizedError } from '../utils/errors';

const API_KEY_HEADER = 'x-api-key';

export function apiKeyMiddleware(keys: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (keys.length === 0) {
      // If no API keys are configured, skip validation
      return next();
    }

    const providedKey = req.headers[API_KEY_HEADER];

    if (!providedKey || typeof providedKey !== 'string') {
      return next(new UnauthorizedError('API key is required'));
    }

    // Use timing-safe comparison to prevent timing attacks
    const providedBuffer = Buffer.from(providedKey, 'utf8');
    const isValidKey = keys.some((key) => {
      const expectedBuffer = Buffer.from(key, 'utf8');
      return (
        expectedBuffer.length === providedBuffer.length &&
        timingSafeEqual(expectedBuffer, providedBuffer)
      );
    });

    if (!isValidKey) {
      return next(new UnauthorizedError('Invalid API key'));
    }

    next();
  };
}
