# Logging Rules

## NEVER use `console.log`

This is enforced by ESLint (`no-console: error`). Always use the Winston logger:

```typescript
import logger from '../../utils/logger';
```

## Structured Format

All log entries use structured format with these fields:

```typescript
logger.log({
  type: 'info',
  key: 'createEmployee.success',
  value: result,
  path: __filename,
  traceId,
});
logger.error({
  type: 'error',
  key: 'createEmployee.error',
  value: error,
  path: __filename,
  traceId,
});
```

| Field     | Purpose                                               |
| --------- | ----------------------------------------------------- |
| `type`    | Log level (`info`, `error`, `warn`)                   |
| `key`     | Dot-notation identifier (e.g., `functionName.action`) |
| `value`   | Data payload (result, error, context)                 |
| `path`    | Source file (`__filename` for traceability)           |
| `traceId` | Request trace ID from AsyncLocalStorage context       |

## Usage

- `logger.log()` — for informational messages
- `logger.error()` — for error conditions
- Always include `path: __filename` for traceability
- Always include meaningful `key` names following `<function>.<action>` pattern

## Destination

Logs are shipped to AWS CloudWatch via Winston transport.
