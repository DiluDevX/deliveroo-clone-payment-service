---
name: quality-checks
description: Pre-commit and pre-deploy quality validation (lint, types, format, build)
disable-model-invocation: true
allowed-tools: Bash
---

Run the full quality pipeline sequentially. Each step must pass before proceeding.

## Pipeline

```bash
# Step 1: Format check
npm run format:check

# Step 2: Lint check
npm run lint:check

# Step 3: Type check
npm run types:check

# Step 4: Build (verify compilation succeeds)
npm run build
```

## Auto-fix Mode

If the user wants to fix issues automatically, run:

```bash
npm run format:fix && npm run lint:fix && npm run types:check
```

Note: `types:check` errors require manual fixes — there is no auto-fix for TypeScript errors.

## Output Format

Report results as a summary table:

| Step   | Status      | Issues               |
| ------ | ----------- | -------------------- |
| Format | PASS / FAIL | N files changed      |
| Lint   | PASS / FAIL | N errors, M warnings |
| Types  | PASS / FAIL | N errors             |
| Build  | PASS / FAIL | N errors             |

If any step fails, list the specific errors and suggested fixes.

## Common Issues & Fixes

| Error                       | Fix                                                          |
| --------------------------- | ------------------------------------------------------------ |
| `any` type used             | Define proper TypeScript type                                |
| `console.log` found         | Replace with `logger` from `src/utils/logger.ts`             |
| `process.env` used directly | Use `environment` singleton from `src/config/environment.ts` |
| Missing return type         | Add explicit return type annotation                          |
| Unused variable             | Remove it (prefix with `_` if it must exist)                 |
| Import order wrong          | Run `npm run lint:fix` to auto-sort                          |
