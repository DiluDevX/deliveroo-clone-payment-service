import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

type ValidationTarget = 'body' | 'query' | 'params';

function createValidator(target: ValidationTarget) {
  return (schema: ZodSchema): RequestHandler => {
    return (req: Request, _res: Response, next: NextFunction): void => {
      try {
        const result = schema.parse(req[target]);
        if (target === 'query') {
          // Clear existing keys before assigning validated result
          Object.keys(req.query).forEach((key) => {
            delete req.query[key];
          });
          Object.assign(req.query, result);
        } else {
          req[target] = result;
        }
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          const sanitizedIssues = error.issues.map((issue) => ({
            path: issue.path.join('.'),
            code: issue.code,
            message: issue.message,
          }));
          logger.error({ issues: sanitizedIssues }, 'Validation error');
          next(new ValidationError('Validation failed'));
          return;
        }
        next(error);
      }
    };
  };
}

/**
 * Validates request body against a Zod schema.
 * @example
 * router.post('/', validateBody(createUserSchema), createUser);
 */
export const validateBody = createValidator('body');

/**
 * Validates query parameters against a Zod schema.
 * @example
 * router.get('/', validateQuery(paginationSchema), listUsers);
 */
export const validateQuery = createValidator('query');

/**
 * Validates route parameters against a Zod schema.
 * @example
 * router.get('/:id', validateParams(idRequestPathParamsSchema), getUser);
 */
export const validateParams = createValidator('params');
