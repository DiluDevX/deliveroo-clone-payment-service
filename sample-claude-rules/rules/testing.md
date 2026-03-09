# Testing Rules

## Framework

- **Unit tests:** Jest + ts-jest in `__tests__/` directory
- **E2E tests:** Cypress 13 in `cypress/` directory
- **Coverage:** nyc (Istanbul), combined from Jest + Cypress reports

## Environment

- Tests run with `TZ=UTC` timezone
- Tests use `.env.test` for environment variables
- If `.env.test` is missing, run `yarn env:copy:test` first

## Commands

| Command                                                   | Purpose                                    |
| --------------------------------------------------------- | ------------------------------------------ |
| `yarn test:unit`                                          | Run unit tests only                        |
| `yarn test:e2e`                                           | Run E2E tests (needs Docker DB)            |
| `yarn test`                                               | Full suite (auto-starts server + coverage) |
| `yarn test:unit:watch`                                    | Watch mode for TDD                         |
| `TZ=UTC npx env-cmd -f .env.test jest --forceExit <path>` | Single test file                           |

## Unit Test Patterns

- Mock Sequelize methods with `jest.spyOn` — do not mock entire modules
- Test each service function independently
- Test controller error paths (ensure `next(error)` is called)
- Test validation schemas with valid and invalid inputs

## Rules

- Never skip tests with `.skip` without documenting the reason
- Never add `// istanbul ignore` to bypass coverage
- E2E tests require a running test database: `yarn test:db:up` (Docker)
- Clean up after E2E with `yarn test:db:down`
- The full `yarn test` command auto-starts a test server — stop any running dev server first to avoid port conflicts
