---
name: api-conventions
description: API design patterns and conventions for this Node.js/Express/TypeScript/Prisma microservice template. Use when creating new endpoints, controllers, services, DTOs, or schemas.
user-invocable: false
---

## Controller Pattern

All controllers are async functions exported by name (no default export):

```typescript
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as itemDatabaseService from '../../services/item.database.service';

export const createItem = async (
  req: Request<unknown, unknown, CreateItemRequestBodyDTO>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const item = await itemDatabaseService.create(req.body);
    res.status(StatusCodes.CREATED).json({ success: true, message: 'Item created', data: item });
  } catch (error) {
    next(error);
  }
};
```

## Service Layer

All Prisma queries live in `*.database.service.ts`. All queries filter `deletedAt: null`:

```typescript
// src/services/item.database.service.ts
import { prisma } from '../config/database';

export const findMany = async (where = {}, pagination = { skip: 0, take: 10 }) => {
  return prisma.item.findMany({ where: { ...where, deletedAt: null }, ...pagination });
};

export const create = async (data: CreateItemRequestBodyDTO) => {
  return prisma.item.create({ data });
};
```

## DTO Naming

Infer types from Zod schemas — never duplicate type definitions:

```typescript
// src/dtos/item.dto.ts
import { z } from 'zod';
import { createItemRequestBodySchema } from '../schema/item.schema';

export type CreateItemRequestBodyDTO = z.infer<typeof createItemRequestBodySchema>;
```

## Zod Schema Validation

Schemas in `src/schema/`, applied as middleware in route definitions:

```typescript
// src/routes/v1/item.routes.ts
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.middleware';

router.post('/', validateBody(createItemRequestBodySchema), createItem);
router.get('/:id', validateParams(idRequestPathParamsSchema), getItemById);
router.get('/', validateQuery(commonRequestQueryParamsSchema), getAllItems);
```

## Route Registration

All routes registered in `src/routes/index.ts`:

```typescript
router.use('/v1/items', itemRoutes);
router.use('/v1/auth', authRoutes);
router.use(commonRoutes); // health + 404 fallback — always last
```

## Response Envelope

```typescript
// Success with data
res.status(StatusCodes.OK).json({ success: true, message: 'Items retrieved', data: items });

// Success paginated
res.status(StatusCodes.OK).json({
  success: true,
  message: 'Items retrieved',
  data: items,
  pagination: { page, limit, total, totalPages },
});

// Success no data
res.status(StatusCodes.OK).json({ success: true, message: 'Item deleted' });
```

## Error Handling

Throw custom errors; the global handler formats responses:

```typescript
import { NotFoundError, ConflictError } from '../utils/errors';

throw new NotFoundError('Item not found');
throw new ConflictError('Item with this name already exists');
```

## Logging

```typescript
import { logger } from '../utils/logger';

logger.info({ msg: 'Item created', itemId: item.id });
logger.error({ msg: 'Failed to create item', error });
// NEVER: console.log(...)
```

## File Naming (kebab-case)

```
src/controllers/v1/my-domain.controller.ts
src/services/my-domain.database.service.ts
src/routes/v1/my-domain.routes.ts
src/schema/my-domain.schema.ts
src/dtos/my-domain.dto.ts
```
