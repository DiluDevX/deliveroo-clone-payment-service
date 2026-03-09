---
name: create-endpoint
description: Scaffold a complete new API endpoint with controller, service, DTO, schema, and route registration
disable-model-invocation: true
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
argument-hint: '[resource-name]'
---

Scaffold a new CRUD endpoint for the given resource. Follow these steps:

## Step 1 — Understand the Requirement

Read `$ARGUMENTS` to determine the resource name (e.g., `orders`, `products`, `users`).
Read existing files to understand patterns:

- `src/controllers/v1/item.controller.ts`
- `src/services/item.database.service.ts`
- `src/schema/item.schema.ts`
- `src/dtos/item.dto.ts`
- `src/routes/v1/item.routes.ts`

## Step 2 — Check for Existing Files

Check if any files for this resource already exist. Do not overwrite — ask the user if found.

## Step 3 — Update Prisma Schema

Add the new model to `prisma/schema.prisma`. Always include:

```prisma
model ResourceName {
  id          String    @id @default(uuid())
  // ... your fields
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?  // required for soft deletes
}
```

Remind the user to run `npm run prisma:migrate:new` and `npm run prisma:generate`.

## Step 4 — Create Files

Create these 5 files in order:

### 1. `src/schema/<resource>.schema.ts`

- `create<Resource>RequestBodySchema` — required fields with `.trim()` and length limits
- `update<Resource>RequestBodySchema` — all fields optional, `.refine()` requiring at least one
- Import and reuse `idRequestPathParamsSchema` and `commonRequestQueryParamsSchema` from `common.schema.ts`

### 2. `src/dtos/<resource>.dto.ts`

- Infer all types from Zod schemas using `z.infer<>`
- Export `<Resource>ResponseDTO` with the full model shape

### 3. `src/services/<resource>.database.service.ts`

- `findMany(where, pagination, orderBy)` — always filter `deletedAt: null`
- `count(where)` — for pagination totals
- `findOneById(id)` — returns `Model | null`
- `create(data)` — maps P2002 → `ConflictError`
- `update(id, data)` — maps P2025 → `NotFoundError`
- `softDelete(id)` — sets `deletedAt: new Date()`, maps P2025 → `NotFoundError`

### 4. `src/controllers/v1/<resource>.controller.ts`

- `create<Resource>`, `getAll<Resource>s`, `get<Resource>ById`, `update<Resource>`, `delete<Resource>`
- All use `try/catch` with `next(error)`
- Full Express Request generics
- HTTP status codes from `http-status-codes`

### 5. `src/routes/v1/<resource>.routes.ts`

- Apply validation middleware in route definition
- Use `validateBody`, `validateParams`, `validateQuery` from `validate.middleware.ts`

## Step 5 — Register Route

Add to `src/routes/index.ts` before the `commonRoutes` line:

```typescript
router.use('/v1/<resource>s', <resource>Routes);
```

## Step 6 — Verify

Run `npm run types:check` to confirm no type errors.
