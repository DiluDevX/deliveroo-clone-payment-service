---
name: quality-checks
description: Pre-deployment quality validation (lint, typecheck, tests, build)
disable-model-invocation: true
allowed-tools: Bash
---

# Quality Checks

Run the full suite of quality checks. Each step must pass before proceeding to the next.

## Execution Order

Run each check sequentially. Stop and report if any step fails.

### Step 1: Format Check

```bash
npm run format:check
```

### Step 2: Lint Check

```bash
npm run lint:check
```

### Step 3: Type Check

```bash
npm run types:check
```

### Step 4: Build

```bash
npm run build
```

### Step 5: Unit Tests

```bash
npm run test
```

## Report

After all checks complete, provide a summary:

| Check      | Status    | Details            |
| ---------- | --------- | ------------------ |
| Format     | PASS/FAIL | —                  |
| Lint       | PASS/FAIL | —                  |
| Typecheck  | PASS/FAIL | —                  |
| Build      | PASS/FAIL | —                  |
| Unit Tests | PASS/FAIL | X passed, Y failed |

If any check fails, provide the error details and suggested fixes.

## Notes

- Unit tests require `.env.test` and a test database. If unavailable, skip with a note.
- E2E tests are excluded from this check as they require Docker and a running server.
- This is a pre-merge/pre-deployment gate, not a replacement for CI/CD.

$ARGUMENTS
