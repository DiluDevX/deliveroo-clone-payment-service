---
name: review
description: Code review against project patterns and conventions
disable-model-invocation: true
allowed-tools: Bash, Read, Grep, Glob
---

Review the code changes against this project's conventions.

## Process

1. **Identify changed files:**

   ```bash
   git diff --name-only HEAD
   # or for staged:
   git diff --name-only --cached
   ```

2. **Read each changed file** thoroughly

3. **Run automated checks** in parallel:

   ```bash
   npm run lint:check
   npm run types:check
   npm run format:check
   ```

4. **Evaluate against checklist:**

### Code Style

- [ ] No `console.log` — `logger` from `src/utils/logger.ts` only
- [ ] No commented-out code
- [ ] No unused variables or imports
- [ ] `kebab-case` file names
- [ ] No ESLint/TypeScript suppression comments

### Architecture

- [ ] Controllers only handle request/response (no business logic)
- [ ] All DB queries in `*.database.service.ts` files
- [ ] Controllers use `try/catch` with `next(error)` — no manual error responses
- [ ] Errors use `AppError` subclasses from `src/utils/errors.ts`

### TypeScript

- [ ] No `any` types
- [ ] DTOs inferred from Zod schemas via `z.infer<>`
- [ ] Full Request generics: `Request<Params, unknown, Body, Query>`

### Validation & Security

- [ ] All inputs validated via Zod middleware in route definitions
- [ ] No direct `process.env` access
- [ ] HTTP status codes from `http-status-codes` package

### Database

- [ ] All queries filter `deletedAt: null`
- [ ] Prisma errors mapped to `AppError` subclasses
- [ ] `prisma:generate` run after schema changes

### Response

- [ ] All responses follow `{ success, message, data? }` envelope
- [ ] Routes registered under `/v1/`

## Output Format

1. **Summary** — overall assessment
2. **Critical Issues** — must fix before merge (with file:line references)
3. **Warnings** — should fix
4. **Suggestions** — improvements
5. **Positive** — good patterns to reinforce
