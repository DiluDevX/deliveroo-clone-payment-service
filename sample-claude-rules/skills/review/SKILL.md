---
name: review
description: Code review against project patterns and conventions
disable-model-invocation: true
allowed-tools: Bash, Read, Grep, Glob
---

# Code Review

Review code changes against the Dinetap Backoffice API patterns and conventions.

## Review Process

1. **Identify changed files:**

```bash
git diff --name-only HEAD~1
```

Or if reviewing staged changes:

```bash
git diff --name-only --staged
```

2. **Read each changed file** and evaluate against the checklist below.

3. **Run automated checks:**

```bash
yarn lint
yarn typecheck
yarn format
```

## Review Checklist

### Code Style

- [ ] No `console.log` usage (must use `logger` from `src/utils/logger.ts`)
- [ ] No commented-out code (`etc/no-commented-out-code` rule)
- [ ] Imports are sorted (auto-sorted by `simple-import-sort`)
- [ ] File naming follows `kebab-case` convention
- [ ] Prettier formatting is correct (single quotes, trailing commas, semicolons)

### Architecture

- [ ] Controllers only handle request/response — business logic is in services
- [ ] Database access is in `*.database.service.ts` files, not in controllers
- [ ] Error handling uses custom exceptions from `src/exceptions/`
- [ ] Controllers use `try/catch` with `next(error)` pattern
- [ ] Request types use Express generics: `Request<Params, ResBody, ReqBody, Query>`
- [ ] Response types use DTOs from `src/dto/`
- [ ] Services imported as namespace: `import * as fooService from '...'`

### TypeScript

- [ ] No `any` types (strict mode enforced)
- [ ] Proper null checks (`strictNullChecks` enabled)
- [ ] Interfaces for models prefixed with `I` (e.g., `IEmployee`)
- [ ] No unused local variables

### Validation

- [ ] Request body validation via AJV schemas in `src/schema/`
- [ ] Validation middleware applied in route definitions (`ValidateBody`, `ValidateParams`, `ValidateQuery`)
- [ ] DTOs defined for request and response bodies

### Security

- [ ] No secrets or credentials hardcoded
- [ ] No `.env` files committed
- [ ] Authentication middleware applied where needed (`checkAuthMiddleware`)
- [ ] Access control middleware used for protected routes

### Testing

- [ ] Unit tests exist for new service functions
- [ ] E2E tests updated if API endpoints changed

## Output Format

Provide a structured review with:

1. **Summary** — Overall assessment
2. **Issues** — Problems found, categorized by severity (critical, warning, suggestion)
3. **Positive** — Good patterns observed

$ARGUMENTS
