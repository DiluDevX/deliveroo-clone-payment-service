# Security Rules

## Secrets

- NEVER commit `.env` files — they contain secrets
- NEVER read `.env` files during Claude Code sessions (blocked by deny rules)
- NEVER hardcode API keys, tokens, passwords, or connection strings
- Use `src/config/env.config.ts` typed singleton for all environment variables

## Input Validation

- Validate ALL request inputs using AJV schemas via `ValidateBody()`, `ValidateParams()`, `ValidateQuery()` middleware
- No SQL injection — always use Sequelize parameterized queries, never raw SQL with string concatenation
- No XSS — sanitize user input before storing or returning

## Authentication & Authorization

- Protected routes MUST use `checkAuthMiddleware` (verifies JWT, attaches `req.user`/`req.populatedUser`)
- After `checkAuthMiddleware`, access the authenticated user via `req.user` (JWT payload) or `req.populatedUser` (full DB record)
- RBAC via `ValidateAccess(roles[])` middleware for role-restricted endpoints
- Never trust client-side data for authorization decisions

## Code Quality Bypasses — NEVER DO THESE

- Never add `// eslint-disable` or `// eslint-disable-next-line` to suppress lint errors
- Never add `// @ts-ignore` or `// @ts-expect-error` to suppress type errors
- Never add `/* prettier-ignore */` to skip formatting
- Never add `any` type to fix TypeScript errors
- Never add empty catch blocks to silence errors
- ALWAYS fix the root cause instead of bypassing the check

## Git Safety

- Never use `git push --force` (blocked by deny rules)
- Never use `git reset --hard` (blocked by deny rules)
- Never run `yarn migrate:up:prod` directly (blocked by deny rules)

## Error Monitoring

- Sentry captures unhandled exceptions automatically
- Sensitive data is scrubbed before sending to Sentry
- Error responses never expose stack traces or internal details to clients
