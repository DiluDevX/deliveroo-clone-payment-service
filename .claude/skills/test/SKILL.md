---
name: test
description: Run tests and report results (once testing is configured for the service)
disable-model-invocation: true
allowed-tools: Bash
---

Run the test suite for this service.

## Check Test Setup First

Verify test tooling is configured:

```bash
ls package.json | xargs grep -E '"test"'
ls __tests__/ 2>/dev/null || echo "No __tests__ directory found"
```

If no test configuration exists, inform the user and refer them to `.claude/rules/testing.md`
for guidance on setting up Jest or Vitest.

## Run Tests (if configured)

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode (TDD)
npm run test:watch

# Single file
npx jest __tests__/services/item.database.service.test.ts --forceExit
```

## Report Format

```
Test Results
============
Suites:  X passed, Y failed
Tests:   X passed, Y failed
Coverage: XX% lines, XX% branches, XX% functions

Failed Tests:
- <test name> (<file>:<line>)
  Expected: ...
  Received: ...
```

## When Tests Fail

1. Read the failing test file and the source file it tests
2. Determine root cause — is the test expectation wrong or is the implementation buggy?
3. Fix the implementation when the test reveals a real bug
4. Only fix test expectations when the expected behavior genuinely changed
5. Re-run to confirm the fix

## Notes

- Never adjust test expectations just to make tests pass
- Run `npm run types:check` after fixing tests — no `any` in test files either
- Mock at the module boundary (Prisma client), not implementation internals
