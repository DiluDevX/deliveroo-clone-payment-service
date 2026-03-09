---
name: test
description: Run tests with proper setup (unit, e2e, or both)
disable-model-invocation: true
allowed-tools: Bash
---

# Test Runner

Run tests for the Dinetap Backoffice API.

## Usage

Determine the appropriate command based on the user's request:

### Unit Tests Only

```bash
yarn test:unit
```

### E2E Tests Only

Ensure the test database is running and the server is started:

```bash
yarn test:db:up
yarn build
yarn test:e2e
```

### All Tests (Unit + E2E with coverage)

```bash
yarn test:db:up
yarn test
```

### Watch Mode (for development)

```bash
yarn test:unit:watch
```

### Single Test File

```bash
TZ=UTC npx env-cmd -f .env.test jest --forceExit <path-to-test>
```

## Notes

- Unit tests require `.env.test` to exist. If missing, run `yarn env:copy:test` first.
- E2E tests require a running test database (`yarn test:db:up`) and Docker.
- The full `yarn test` command auto-starts a test server on a configured port. If the port is already in use, it will fail — stop any running dev server first.
- After E2E tests, clean up with `yarn test:db:down` if requested.
- Report test results clearly: number of passing/failing tests and any error details.

$ARGUMENTS
