# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

A production-ready TypeScript/Express Node.js microservice starter template. Every service
built from this template shares the same architecture, conventions, and toolchain.

- **Runtime:** Node.js >= 24
- **Package Manager:** npm (use `npm ci` in CI, `npm install` locally)
- **Language:** TypeScript 5.x (strict mode)
- **Framework:** Express.js 5.x
- **ORM:** Prisma 7.x with PostgreSQL
- **Validation:** Zod for schemas, DTOs, and environment variables
- **Logging:** Pino (pretty in dev, JSON in production)
- **Auth:** JWT + timing-safe API key middleware
- **CI/CD:** GitHub Actions — PR quality checks, Semantic Release, EC2 deploy

## Common Commands

```bash
npm run dev                  # Start dev server with nodemon (hot reload via ts-node)
npm run build                # Compile TypeScript → dist/
npm run start:development    # Run compiled server (dev)
npm run start:production     # Run compiled server (prod)

npm run lint:check           # ESLint check
npm run lint:fix             # ESLint auto-fix
npm run format:check         # Prettier check
npm run format:fix           # Prettier auto-fix
npm run types:check          # Type-check without emitting

npm run prisma:generate      # Generate Prisma client
npm run prisma:migrate:new   # Create + run a new migration (dev)
npm run prisma:migrate       # Run pending migrations (deploy/production)
npm run prisma:studio        # Open Prisma Studio
npm run prisma:push          # Push schema to DB without migration (prototyping)

npm run release              # Run semantic-release
npm run release:dry-run      # Preview release without publishing
```

## Architecture

**Layered Express architecture:** Routes → Middleware → Controllers → Services → DB

```text
src/
├── config/          # environment.ts (typed singleton), database.ts (Prisma client)
├── controllers/     # common.controller.ts + v1/<domain>.controller.ts
├── dtos/            # TypeScript interfaces inferred from Zod schemas
├── emails/          # React Email templates
├── middleware/      # validate, error-handler, rate-limiter, api-key
├── routes/          # index.ts + common.routes.ts + v1/<domain>.routes.ts
├── schema/          # Zod validation schemas (common + per-domain)
├── services/        # <domain>.database.service.ts — all Prisma queries live here
├── utils/           # constants.ts, errors.ts, logger.ts
└── index.ts         # Entry point: connect DB, start HTTP, graceful shutdown
```

### Key Patterns

- **Request flow:** Rate limiter → JSON body parser → routes → global error handler
- **Validation:** Zod schemas in `src/schema/`; applied via `validateBody`, `validateQuery`, `validateParams` middleware
- **Response envelope:** `{ success: boolean, message: string, data?: T }`
- **Error handling:** All errors forwarded via `next(error)`; custom `AppError` subclasses in `src/utils/errors.ts`
- **DB access:** Only inside `*.database.service.ts`; all queries filter `deletedAt: null` for soft deletes
- **Environment:** Typed singleton in `src/config/environment.ts`, validated at startup — never `process.env` directly elsewhere
- **API versioning:** Routes under `/v1/` (add `/v2/` when breaking changes are needed)
- **Logging:** Pino only — never `console.log`; `service` and `env` injected on every log line

## Rules

Detailed conventions are auto-loaded from `.claude/rules/`:

| Rule File               | Covers                                                     |
| ----------------------- | ---------------------------------------------------------- |
| `typescript.md`         | Strict mode, type safety, Zod inference, code quality      |
| `naming-conventions.md` | Files, controllers, services, DTOs, schemas, errors        |
| `error-handling.md`     | AppError hierarchy, controller pattern, HTTP status codes  |
| `logging.md`            | Pino logger usage, structured format, never console.log    |
| `testing.md`            | Test setup, patterns, coverage targets, tooling guidance   |
| `security.md`           | Secrets, input validation, auth, timing-safe comparisons   |
| `git-workflow.md`       | Conventional commits, branches, Husky pre-commit, npm only |

## Database & Migrations

- **Migrations (dev):** `npm run prisma:migrate:new` — interactive, creates + runs migration
- **Migrations (deploy):** `npm run prisma:migrate` — runs pending migrations non-interactively
- **Client generation:** `npm run prisma:generate` — must run after any `schema.prisma` change
- **Soft deletes:** All models should include `deletedAt DateTime?`; services always filter `deletedAt: null`
- Always add both a migration and update the Prisma schema together

## Important Rules

- NEVER use `console.log` — always use `logger` from `src/utils/logger.ts`
- NEVER access `process.env` directly — use the `environment` singleton from `src/config/environment.ts`
- NEVER commit `.env` files — they contain secrets
- NEVER use `any` type — find or define the correct TypeScript type
- NEVER bypass ESLint, Prettier, or TypeScript errors with suppression comments
- NEVER use `npm install` in CI — use `npm ci` for reproducible builds
- Controllers handle ONLY request/response — all business logic belongs in services
- All DB queries must live in `*.database.service.ts` files
