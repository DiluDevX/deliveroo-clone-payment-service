import { Request, Response, NextFunction, RequestHandler } from 'express';
import type { ActorType } from '../types/express.d';

const VALID_ACTOR_TYPES: ActorType[] = ['USER', 'RESTAURANT', 'DRIVER', 'SYSTEM'];

function isValidActorType(value: string): value is ActorType {
  return VALID_ACTOR_TYPES.includes(value as ActorType);
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

  const actorType = typeof rawType === 'string' && isValidActorType(rawType) ? rawType : 'SYSTEM';

  req.actor = {
    type: actorType,
    userId: typeof userId === 'string' && userId.length > 0 ? userId : undefined,
    actorId: typeof actorId === 'string' && actorId.length > 0 ? actorId : undefined,
  };

  next();
};
