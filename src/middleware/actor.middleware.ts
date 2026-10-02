import { Request, Response, NextFunction, RequestHandler } from 'express';
import type { ActorType } from '../types/express.d';
import { UnauthorizedError } from '../utils/errors';

function isValidActorType(value: string): value is ActorType {
  return value === 'USER' || value === 'RESTAURANT' || value === 'DRIVER' || value === 'SYSTEM';
}

/**
 * Parses trusted inter-service headers into a typed req.actor context.
 *
 * Headers consumed:
 *   X-User-Id    — the userId forwarded from the gateway
 *   X-Actor-Type — USER | RESTAURANT | DRIVER | SYSTEM
 *   X-Actor-Id   — optional actor-specific id (e.g. restaurant or driver id)
 *
 * The actor object is attached to req.actor. Controllers must use
 * req.actor and never read raw headers directly.
 */
export const actorMiddleware: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const rawType = req.headers['x-actor-type'];
  const userId = req.headers['x-user-id'];
  const actorId = req.headers['x-actor-id'];

  let actorHeaderCount = 0;
  for (let index = 0; index < req.rawHeaders.length; index += 2) {
    if (req.rawHeaders[index].toLowerCase() === 'x-actor-type') {
      actorHeaderCount += 1;
    }
  }

  if (actorHeaderCount !== 1 || typeof rawType !== 'string' || !isValidActorType(rawType)) {
    next(new UnauthorizedError('Valid actor type is required'));
    return;
  }

  req.actor = {
    type: rawType,
    userId: typeof userId === 'string' && userId.length > 0 ? userId : undefined,
    actorId: typeof actorId === 'string' && actorId.length > 0 ? actorId : undefined,
  };

  next();
};
