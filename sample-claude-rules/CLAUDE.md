# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dinetap Backoffice API — a Node.js/Express.js Backend-For-Frontend (BFF) REST API for restaurant management (POS, payments, menus, orders). Written in TypeScript, backed by MySQL via Sequelize ORM.

- **Repository:** eatme-global/backoffice-api
- **Runtime:** Node.js 20+
- **Package Manager:** Yarn 4.3.0 (Berry) — do NOT use npm
- **Language:** TypeScript 5.6.3
- **Framework:** Express.js 4.x
- **ORM:** Sequelize 6.x with MySQL (mysql2 driver)
- **Monitoring:** Sentry for errors, Winston + CloudWatch for logging
- **CI/CD:** GitHub Actions, Semantic Release, SonarQube

## Common Commands

```bash
yarn build                  # Clean dist/ and compile TypeScript
yarn start                  # Run compiled server (node ./dist/server.js)
yarn start:watch            # Build watch + nodemon for local dev
yarn typecheck              # Type-check without emitting

yarn lint                   # ESLint check
yarn lint:fix               # ESLint auto-fix
yarn format                 # Prettier check
yarn format:fix             # Prettier auto-fix

yarn test                   # Full test suite (setup + unit + coverage)
yarn test:unit              # Jest unit tests only (uses .env.test)
yarn test:unit:watch        # Jest watch mode
yarn test:e2e               # Cypress E2E tests
yarn test:db:up             # Start Docker MySQL test container
yarn test:db:down           # Stop Docker MySQL test container

yarn migrate:create         # Generate new Sequelize migration
yarn migrate:up:<env>       # Run migrations (qa/staging/prod)
yarn migrate:down           # Rollback last migration

yarn env:copy:<env>         # Copy .env.<env> to .env (local/test/qa/staging/prod)
```

To run a single test file: `TZ=UTC npx env-cmd -f .env.test jest --forceExit <path-to-test>`

## Architecture

**Layered Express architecture:** Routes → Middleware → Controllers → Services → Models

```
src/
├── config/         # App setup, DB connection, env singleton, SES, Sentry
├── constants/      # Enums and shared constants
├── controllers/    # v1/ and v2/ request handlers (try/catch → next(error))
├── dto/            # TypeScript interfaces for request/response shapes
├── exceptions/     # Custom HTTP exceptions extending ApplicationException
├── middleware/     # Auth, validation, error handling, rate limiting
├── migrations/     # Sequelize migration files
├── models/         # Sequelize model definitions (InferAttributes pattern)
├── routes/         # v1/ and v2/ Express Router definitions
├── schema/         # AJV JSON Schema validators for request validation
├── services/       # Business logic + *.database.service.ts for DB queries
├── types/          # Shared TypeScript types
├── utils/          # Helpers (logger, calculations, payments, receipts)
└── server.ts       # Entry point: DB connect, start Express, graceful shutdown
```

### Key Patterns

- **Request flow:** Rate limit → body/query parsing → bearer token extraction → CORS/helmet/compression → AsyncLocalStorage context (trace ID) → success response wrapper → routes → Sentry → global error handler
- **Auth:** `checkAuthMiddleware` verifies JWT; `ValidateAccess(roles[])` for RBAC
- **Validation:** `ValidateBody(schema)`, `ValidateParams(schema)`, `ValidateQuery(schema)` using AJV
- **Response envelope:** Success: `{ error: false, message: "OK", data }` — Errors: `{ error: true, message, code? }`
- **DB config:** Sequelize v6 with read/write replication (write → primary, read → replica)
- **Environment:** Typed singleton in `src/config/env.config.ts`, validated at startup
- **API Versioning:** Routes under `/v1` and `/v2`. The `/api` prefix is stripped by middleware.

### External Integrations

Adyen & Stripe (payments), AWS SES & Postmark (email), Pusher (real-time events), CloudWatch (logs), Sentry (errors), Slack webhooks (alerts), Cognito (OAuth).

## Rules

Detailed conventions are auto-loaded from `.claude/rules/`:

| Rule File               | Covers                                                       |
| ----------------------- | ------------------------------------------------------------ |
| `typescript.md`         | Strict mode, type safety, imports, code quality              |
| `naming-conventions.md` | Files, controllers, services, models, DTOs, schemas          |
| `error-handling.md`     | Custom exceptions, controller pattern, HTTP status codes     |
| `logging.md`            | Winston logger usage, structured format, never console.log   |
| `testing.md`            | Jest + Cypress patterns, mocking, environment setup          |
| `security.md`           | Secrets, input validation, auth, never bypass quality checks |
| `git-workflow.md`       | Conventional commits, branches, Husky pre-commit, yarn only  |

## Database & Migrations

- **Build first:** `yarn build` must succeed before running migrations (`config/config.js` imports from `dist/`)
- **Create:** `yarn migrate:create` (interactive, uses dashes in name)
- **Run:** `yarn migrate:up:staging` / `qa` / `prod`
- **Undo:** `yarn migrate:down`
- Always implement both `up` and `down` functions for reversibility

## Important Rules

- NEVER use `console.log` — always use `logger` from `src/utils/logger.ts`
- NEVER use npm — this project uses Yarn 4.3.0 (Berry)
- NEVER commit `.env` files — they contain secrets
- `yarn build` is required before running migrations
- Shared packages: `@eatme-global/constants`, `@eatme-global/dto`, `@eatme-global/types`
- Node >= 20, Yarn >= 4.3.0
