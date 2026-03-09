# TypeScript Rules

## Strict Mode

This project uses TypeScript strict mode. These compiler options are enforced:

- `noImplicitAny` — never leave types unresolved
- `strictNullChecks` — handle null/undefined explicitly
- `noImplicitThis` — always type `this` context
- `noUnusedLocals` — remove unused variables
- `forceConsistentCasingInFileNames` — match file system casing
- Target: ES6, Module: CommonJS

## Type Safety

- Never use `any` as a type — find or create the correct type
- Never use `// @ts-ignore` or `// @ts-expect-error` — fix the underlying type issue
- Never use type assertions (`as any`, `as unknown`) to bypass type checking
- Use generated Prisma types for DB operations (e.g., `Prisma.ItemWhereInput`, `Prisma.ItemCreateInput`, `Prisma.ItemUpdateInput`) — never hand-roll equivalent shapes
- Use Zod for all validation schemas (e.g., `z.object()`, `z.string()`, `z.enum()`) and infer TypeScript types from them via `z.infer<typeof schema>`

## Imports

- Use namespace imports for services: `import * as employeeService from '../../services/employee.database.service'`
- Imports are auto-sorted by `simple-import-sort` (enforced by ESLint)
- Use relative paths for imports (e.g., `../../services/employee.database.service`)

## Code Quality

- No commented-out code (enforced by ESLint `etc/no-commented-out-code: error`)
- SonarJS rules are enabled — avoid code smells and cognitive complexity
- Prettier enforces: single quotes, trailing commas (all), semicolons, arrow parens always
