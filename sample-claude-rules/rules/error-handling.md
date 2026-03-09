# Error Handling Rules

## Custom Exceptions

Always use custom exceptions from `src/exceptions/`. Never use generic `throw new Error()`.

Available exceptions:

| Exception                      | HTTP Status |
| ------------------------------ | ----------- |
| `BadRequestException`          | 400         |
| `UnauthorizedException`        | 401         |
| `ForbiddenException`           | 403         |
| `NotFoundException`            | 404         |
| `ResourceNotFoundException`    | 404         |
| `RequestTimeoutException`      | 408         |
| `ConflictException`            | 409         |
| `PreconditionFailedException`  | 412         |
| `UnprocessableEntityException` | 422         |
| `TooManyRequestsException`     | 429         |
| `InternalServerErrorException` | 500         |
| `ServiceUnavailableException`  | 503         |

All extend `ApplicationException` from `src/exceptions/application.exception.ts`.

## Controller Pattern

Controllers must use `try/catch` with `next(error)`:

```typescript
export const myAction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await myService.doSomething(req.body);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};
```

## HTTP Status Codes

Use `http-status-codes` package constants — never hardcode numbers:

```typescript
import { StatusCodes } from 'http-status-codes';
res.status(StatusCodes.CREATED).json(result); // not res.status(201)
```

## Response Envelope

Success responses are auto-wrapped by middleware as:

```json
{ "error": false, "message": "OK", "data": <result> }
```

Error responses are formatted as:

```json
{ "error": true, "message": "<error message>", "code": "<optional code>" }
```

## Rules

- Never use empty catch blocks — always handle or propagate the error
- Never swallow errors silently — log them with `logger.error()`
- Never throw generic `Error` — use the appropriate custom exception
- Never return error responses manually — throw the exception and let the global error handler format it
