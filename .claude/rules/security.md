# Security Rules

## Secrets & Environment Variables

- NEVER commit `.env` files — blocked by `.gitignore`
- NEVER access `process.env` directly anywhere in `src/` — always use the typed `environment` singleton from `src/config/environment.ts`
- NEVER hardcode API keys, tokens, passwords, or connection strings
- Use `.env.example` to document required variables — never put real values there

```typescript
// WRONG
const secret = process.env.JWT_SECRET;

// CORRECT
import { environment } from '../config/environment';
const secret = environment.jwtSecret;
```

## Input Validation

- Validate ALL request inputs (body, query, params) using Zod schemas before they reach the controller
- Apply validation middleware in the route definition — not inside controllers:

```typescript
router.post('/', validateBody(createItemRequestBodySchema), createItem);
router.get('/:id', validateParams(idRequestPathParamsSchema), getItemById);
```

- Never trust client-provided IDs or values without schema coercion
- Sanitize/trim string inputs in Zod schemas (`.trim()`, `.min()`, `.max()`)

## Authentication & Authorization

- API key routes use `apiKeyMiddleware` (timing-safe comparison via `crypto.timingSafeEqual`)
- JWT-protected routes must apply JWT verification middleware before the controller
- Never trust client-side data for authorization decisions — always verify server-side
- Rotate secrets immediately if accidentally exposed; invalidate all issued tokens

## Prisma & Database

- Never write raw SQL with string concatenation — always use Prisma's parameterized query API
- All queries must filter `deletedAt: null` — enforce soft-delete consistency
- Use `isPrismaErrorWithCode()` type guard when catching Prisma errors
- Wrap sensitive DB operations in transactions when atomicity is required

## Code Quality Bypasses — NEVER DO THESE

- Never add `// eslint-disable` or `// eslint-disable-next-line` to suppress lint errors
- Never add `// @ts-ignore` or `// @ts-expect-error` to suppress type errors
- Never add `/* prettier-ignore */` to skip formatting
- Never use `any` type as an escape hatch
- Never add empty catch blocks to silence errors
- ALWAYS fix the root cause instead of bypassing the check

## Git Safety

- Never use `git push --force` on `main` or `develop`
- Never commit secrets — use `git diff --staged` to review before committing
- Never bypass Husky hooks with `--no-verify`
- If secrets are accidentally committed, rotate them immediately and rewrite history

## Docker & Deployment

- The Docker image runs as a non-root user (`app:nodejs`, uid/gid 1001)
- Never pass secrets as Docker build args that end up in image layers — use runtime env vars or secrets injection (Doppler)
- Production deployments use Doppler for secrets injection — never store secrets in ECR image metadata

## Error Responses

- Never expose stack traces in production error responses
- Never reveal internal implementation details (DB table names, Prisma error codes) to clients
- Non-operational errors (bugs) return generic 500 messages; `isOperational: true` errors return their own message
