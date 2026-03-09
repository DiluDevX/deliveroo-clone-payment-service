# Naming Conventions

## Files

All files use `kebab-case`:

- Controllers: `<domain>.controller.ts` (in `src/controllers/v1/`)
- Database Services: `<domain>.database.service.ts` (in `src/services/`)
- DTOs: `<domain>.dto.ts` (in `src/dtos/`)
- Schemas: `<domain>.schema.ts` (in `src/schema/`)
- Routes: `<domain>.routes.ts` (in `src/routes/v1/`)
- Middleware: `<name>.middleware.ts` (in `src/middleware/`)
- Config: `<name>.ts` (in `src/config/`)
- Utils: `<name>.ts` (in `src/utils/`)

## Controllers

Exported async functions with full Express generic types:

```typescript
export const myAction = async (
  req: Request<ParamsDTO, unknown, BodyDTO, QueryDTO>,
  res: Response,
  next: NextFunction,
): Promise<void> => { ... };
```

Controller file exports named functions — no default exports.

## Services

- `<domain>.database.service.ts` — direct Prisma operations only (CRUD, queries, transactions)
- No `<domain>.service.ts` files unless there is genuine business logic to separate

## DTOs

Defined in `src/dtos/<domain>.dto.ts`. Infer from Zod schemas where possible:

```typescript
export type CreateItemRequestBodyDTO = z.infer<typeof createItemRequestBodySchema>;
```

Suffix patterns:

- `<Action><Resource>RequestBodyDTO` — request body shape
- `<Action><Resource>ResponseDTO` — response data shape
- `<Action><Resource>RequestParamsDTO` — URL params shape
- `<Action><Resource>RequestQueryDTO` — query string shape

## Schemas

Zod schemas in `src/schema/<domain>.schema.ts`. Match the controller domain:

- `item.schema.ts` for the item controller
- `common.schema.ts` for shared schemas (UUID params, pagination, email, password)

Schema variable naming: `<action><Resource><target>Schema`

- `createItemRequestBodySchema`
- `idRequestPathParamsSchema`
- `commonRequestQueryParamsSchema`

## Errors

PascalCase, extend `AppError` from `src/utils/errors.ts`:

- `BadRequestError`, `NotFoundError`, `ConflictError`, `UnauthorizedError`, etc.

## Routes

Route files export a single default `express.Router()`. Registered in `src/routes/index.ts`.

## Constants

- Values: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRY_COUNT`)
- Grouped into objects: `VALIDATION_PATTERNS`, `PRISMA_CODE`
- All constants live in `src/utils/constants.ts` (or a domain-specific `<domain>.constants.ts`)

## Booleans

Use descriptive names with auxiliary verbs: `isActive`, `hasError`, `canDelete`, `shouldRetry`, `isDevelopment`
