# Error Handling Rules

## Custom Error Hierarchy

Always use custom errors from `src/utils/errors.ts`. Never throw generic `new Error()`.

All extend `AppError` (base class with `statusCode`, `isOperational`, `code`):

| Class                  | HTTP Status | When to use                              |
| ---------------------- | ----------- | ---------------------------------------- |
| `BadRequestError`      | 400         | Malformed input, business rule violation |
| `UnauthorizedError`    | 401         | Missing or invalid auth token            |
| `ForbiddenError`       | 403         | Authenticated but lacks permission       |
| `NotFoundError`        | 404         | Resource not found                       |
| `ConflictError`        | 409         | Duplicate resource (Prisma P2002)        |
| `ValidationError`      | 400         | Zod schema validation failure            |
| `TooManyRequestsError` | 429         | Rate limit exceeded                      |
| `InternalServerError`  | 500         | Unexpected / non-operational errors      |

Add new subclasses to `src/utils/errors.ts` as the service grows — never reach for the base `Error` class.

## Controller Pattern

All controllers use `try/catch` with `next(error)` — never respond with errors directly:

```typescript
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

## HTTP Status Codes

Use the `http-status-codes` package — never hardcode numbers:

```typescript
import { StatusCodes } from 'http-status-codes';
res.status(StatusCodes.OK).json(...);      // not res.status(200)
res.status(StatusCodes.CREATED).json(...); // not res.status(201)
```

## Response Envelope

All responses follow the shared envelope:

```typescript
// Success
{ success: true, message: 'Item created', data: item }

// Success (no data)
{ success: true, message: 'Item deleted' }

// Error (formatted by global error handler)
{ success: false, message: 'Resource not found' }
```

## Global Error Handler

`src/middleware/error-handler.middleware.ts` catches:

- `AppError` subclasses → uses `statusCode` + `message`
- Prisma `P2002` → maps to `ConflictError` (409)
- Prisma `P2025` → maps to `NotFoundError` (404)
- JWT `JsonWebTokenError` → 401
- JWT `TokenExpiredError` → 401
- All others → 500 (generic message, stack in non-production logs)

## Rules

- Never use empty catch blocks — always handle or propagate with `next(error)`
- Never swallow errors silently — log with `logger.error()`
- Never return error responses manually from controllers — throw and let the handler format them
- Never expose stack traces or internal details in error responses sent to clients
- Use `isPrismaErrorWithCode()` type guard from `src/config/database.ts` when handling Prisma errors in services
