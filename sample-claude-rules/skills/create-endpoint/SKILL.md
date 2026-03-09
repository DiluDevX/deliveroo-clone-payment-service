---
name: create-endpoint
description: Scaffold a new API endpoint with controller, service, DTO, schema, and route
disable-model-invocation: true
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
argument-hint: '[resource-name]'
---

# Create Endpoint

Scaffold a new API endpoint following the project's established patterns.

## Steps

1. **Understand the requirement** from the user's description.

2. **Check for existing files** — search for related controllers, services, DTOs in the codebase to avoid duplicates.

3. **Create the following files** (use an existing endpoint like `auth` or `employee` as reference):

### Files to Create

| File       | Path                                          | Purpose                                       |
| ---------- | --------------------------------------------- | --------------------------------------------- |
| DTO        | `src/dto/<resource>.dto.ts`                   | Request/response type interfaces              |
| Schema     | `src/schema/<resource>.schema.ts`             | Zod validation schemas (`z.object()`)         |
| DB Service | `src/services/<resource>.database.service.ts` | Prisma CRUD operations                        |
| Service    | `src/services/<resource>.service.ts`          | Business logic (if needed)                    |
| Controller | `src/controllers/v1/<resource>.controller.ts` | Request handlers with try/catch + next(error) |
| Routes     | `src/routes/v1/<resource>.routes.ts`          | Express Router with middleware chain          |

4. **Register the route** in `src/routes/v1/index.ts` (or the appropriate version).

5. **Follow conventions:**
   - File naming: `kebab-case`
   - DTO naming: `<Action><Resource>RequestBodyDTO`, `<Action><Resource>ResponseBodyDTO`
   - Controller signature: `async (req: Request<Params, ResBody, ReqBody, Query>, res: Response, next: NextFunction)`
   - Service imports: `import * as resourceService from '../../services/resource.database.service'`
   - Status codes from `http-status-codes` package
   - Auth middleware: `checkAuthMiddleware` on protected routes
   - Validation middleware: `ValidateBody(schema)` on POST/PUT/PATCH routes

6. **Read existing examples** before creating — look at a similar controller/service pair for reference patterns.

$ARGUMENTS
