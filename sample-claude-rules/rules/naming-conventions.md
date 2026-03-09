# Naming Conventions

## Files

All files use `kebab-case`:

- Controllers: `my-domain.controller.ts`
- Services: `my-domain.service.ts` (business logic) or `my-domain.database.service.ts` (Prisma queries)
- Models: `my-domain.model.ts`
- DTOs: `my-domain.dto.ts`
- Schemas: `my-domain.schema.ts`
- Routes: `my-domain.routes.ts`
- Constants: `my-domain.constants.ts`

## Controllers

Exported async functions with Express-typed parameters:

```typescript
export const myAction = async (
  req: Request<ParamsDTO, unknown, BodyDTO, QueryDTO>,
  res: Response,
  next: NextFunction,
) => { ... }
```

## Services

- `*.service.ts` — business logic, external API calls, orchestration
- `*.database.service.ts` — direct Sequelize operations (CRUD, queries)

## Models

- PascalCase model name: `Employee`, `Restaurant`
- Interface prefixed with `I`: `IEmployee`, `IRestaurant`

## DTOs

Defined in `src/dto/<domain>.dto.ts` with suffixes:

- `<Action><Resource>RequestBodyDTO` — request body shape
- `<Action><Resource>ResponseBodyDTO` — response body shape
- `<Action><Resource>RequestParamsDTO` — URL params shape
- `<Action><Resource>RequestQueryDTO` — query string shape

## Schemas

Match the controller domain: `auth.schema.ts` for auth controller.

## Exceptions

PascalCase, extend `ApplicationException`: `BadRequestException`, `NotFoundException`

## Constants

- Values: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRY_COUNT`)
- Files: `kebab-case.constants.ts`

## Booleans

Use descriptive names with auxiliary verbs: `isActive`, `hasError`, `canDelete`, `shouldRetry`
