# Testing Rules

## Current State

This template ships with **no test tooling pre-configured**. When adding tests to a service
built from this template, follow the patterns below.

## Recommended Stack

- **Unit tests:** Jest + ts-jest (or Vitest — preferred for new services)
- **Coverage:** V8 provider via Jest/Vitest
- **Mocking:** `jest.spyOn` (or `vi.spyOn`) for Prisma client methods
- **Test data:** `@faker-js/faker` for generating realistic mock data
- **E2E / integration:** Supertest against the Express app

## Directory Structure

Mirror `src/` structure under `__tests__/`:

```
__tests__/
├── controllers/
│   └── v1/
│       └── item.controller.test.ts
├── services/
│   └── item.database.service.test.ts
├── middleware/
│   └── validate.middleware.test.ts
└── utils/
    └── errors.test.ts
```

## Unit Test Patterns

### Database Service Tests

Mock the Prisma client — never hit a real database in unit tests:

```typescript
import { prisma } from '../../src/config/database';

jest.mock('../../src/config/database');

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('item.database.service', () => {
  it('findMany returns paginated results', async () => {
    mockPrisma.item.findMany.mockResolvedValue([...]);
    const result = await itemDatabaseService.findMany({}, { skip: 0, take: 10 });
    expect(result).toHaveLength(1);
  });
});
```

### Controller Tests

Use Supertest to test the full request/response cycle:

```typescript
import request from 'supertest';
import { app } from '../../src/server';

describe('POST /v1/items', () => {
  it('returns 201 with valid body', async () => {
    const res = await request(app).post('/v1/items').send({ name: 'Widget' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});
```

### Error Path Testing

Always test that controllers call `next(error)` on failure:

```typescript
it('calls next with error when service throws', async () => {
  mockService.create.mockRejectedValue(new ConflictError('Duplicate name'));
  const res = await request(app).post('/v1/items').send({ name: 'Dup' });
  expect(res.status).toBe(409);
});
```

## Coverage Targets

When a test suite exists, aim for:

| Metric   | Target |
| -------- | ------ |
| Line     | > 80%  |
| Branch   | > 75%  |
| Function | > 75%  |

## Rules

- Never skip tests with `.skip` without a documented reason
- Never add coverage ignore comments (`/* istanbul ignore */`) to bypass coverage
- Mock at the module boundary — avoid mocking internal implementation details
- Fix the implementation when a test reveals a bug — do not adjust expectations to pass
- Validate schemas with both valid and invalid inputs — test rejection cases explicitly
- Run `npm run types:check` before considering a test file complete (no `any` in tests either)

## Adding Test Tooling

When setting up tests for the first time in a derived service:

```bash
npm install -D jest ts-jest @types/jest @faker-js/faker supertest @types/supertest
# or for Vitest:
npm install -D vitest @vitest/coverage-v8 @faker-js/faker supertest @types/supertest
```

Add test script to `package.json`:

```json
"test": "jest --forceExit",
"test:watch": "jest --watch",
"test:coverage": "jest --coverage"
```
