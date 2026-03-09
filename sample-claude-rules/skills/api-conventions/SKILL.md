---
name: api-conventions
description: API design patterns and conventions for the Dinetap backoffice API. Use when creating new endpoints, controllers, services, models, DTOs, or schemas.
user-invocable: false
---

# API Conventions

Follow these conventions when creating or modifying API code in this project.

## Controller Pattern

Controllers are exported async functions in `src/controllers/v1/` or `v2/`:

```typescript
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { MyRequestBodyDTO, MyResponseBodyDTO } from '../../dto/my-domain.dto';
import BadRequestException from '../../exceptions/bad-request.exception';
import * as myService from '../../services/my-domain.database.service';
import logger from '../../utils/logger';

export const createResource = async (
  req: Request<unknown, unknown, MyRequestBodyDTO>,
  res: Response<MyResponseBodyDTO>,
  next: NextFunction
) => {
  try {
    const result = await myService.create(req.body);
    res.status(StatusCodes.CREATED).json(result);
  } catch (error) {
    next(error);
  }
};
```

## Service Separation

- `*.database.service.ts` — Direct Sequelize operations (CRUD, queries)
- `*.service.ts` — Business logic, external API calls, orchestration

Import services as namespaces:

```typescript
import * as employeeService from '../../services/employee.database.service';
```

## DTO Naming

Define in `src/dto/<domain>.dto.ts`:

- `<Action><Resource>RequestBodyDTO`
- `<Action><Resource>ResponseBodyDTO`
- `<Action><Resource>RequestParamsDTO`
- `<Action><Resource>RequestQueryDTO`

## AJV Schema Validation

Define schemas in `src/schema/<domain>.schema.ts`:

```typescript
import { JSONSchemaType } from 'ajv';
import { MyRequestBodyDTO } from '../dto/my-domain.dto';

export const myRequestBodySchema: JSONSchemaType<MyRequestBodyDTO> = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    value: { type: 'number' },
  },
  required: ['name', 'value'],
};
```

## Route Definition

Define routes in `src/routes/v1/<domain>.routes.ts`:

```typescript
import { Router } from 'express';
import { createResource, getResource } from '../../controllers/v1/my-domain.controller';
import checkAuthMiddleware from '../../middleware/check-auth.middleware';
import ValidateBody from '../../middleware/validate-body.middleware';
import { myRequestBodySchema } from '../../schema/my-domain.schema';

const myRoutes = Router();
myRoutes.post('/', checkAuthMiddleware, ValidateBody(myRequestBodySchema), createResource);
myRoutes.get('/:id', checkAuthMiddleware, getResource);

export default myRoutes;
```

## Error Handling

Use custom exceptions from `src/exceptions/`:

- `BadRequestException` (400)
- `UnauthorizedException` (401)
- `ForbiddenException` (403)
- `NotFoundException` (404)
- `ResourceNotFoundException` (404)
- `RequestTimeoutException` (408)
- `ConflictException` (409)
- `PreconditionFailedException` (412)
- `UnprocessableEntityException` (422)
- `TooManyRequestsException` (429)
- `InternalServerErrorException` (500)
- `ServiceUnavailableException` (503)

## Logging

Always use the Winston logger, never `console.log`:

```typescript
import logger from '../../utils/logger';
logger.error({ key: 'createResource.error', value: error, path: __filename });
```

## File Naming

All files use `kebab-case`:

- `my-domain.controller.ts`
- `my-domain.database.service.ts`
- `my-domain.service.ts`
- `my-domain.dto.ts`
- `my-domain.schema.ts`
- `my-domain.routes.ts`
