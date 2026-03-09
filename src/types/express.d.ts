export type ActorType = 'USER' | 'RESTAURANT' | 'DRIVER' | 'SYSTEM';

export interface ActorContext {
  type: ActorType;
  userId?: string;
  actorId?: string;
}

declare global {
  namespace Express {
    interface Request {
      actor?: ActorContext;
    }
  }
}
