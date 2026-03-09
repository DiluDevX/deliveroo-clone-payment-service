# Logging Rules

## NEVER use `console.log`

This is enforced by ESLint. Always use the Pino logger:

```typescript
import { logger } from '../../utils/logger';
```

## Log Levels

Use the appropriate level for the situation:

```typescript
logger.info({ msg: 'Server started', port: 3000 });
logger.warn({ msg: 'Deprecated feature used', feature: 'xyz' });
logger.error({ msg: 'Database connection failed', error });
logger.fatal({ msg: 'Unrecoverable startup error', error });
logger.debug({ msg: 'Query executed', query, durationMs });
```

## Structured Format

All log entries are structured objects. Every line automatically includes `service` and `env` fields injected by the logger base config.

Recommended fields:

```typescript
logger.info({ msg: 'Item created', itemId: item.id, userId: req.user?.id });
logger.error({ msg: 'Failed to create item', error, body: req.body });
```

| Field             | Purpose                                                    |
| ----------------- | ---------------------------------------------------------- |
| `msg`             | Human-readable description of the event                    |
| `error`           | The caught error object (Pino serializes it automatically) |
| Additional fields | Relevant context (IDs, counts, durations)                  |

## Output Format

- **Development:** `pino-pretty` transport — colorized, human-readable timestamps, `pid`/`hostname` hidden
- **Production:** Raw JSON — structured for log aggregators (CloudWatch, Datadog, etc.)

## What to Log

- Server startup / shutdown events (`info`)
- Database connect / disconnect (`info`)
- Unhandled errors in the global error handler (`error`)
- Fatal startup failures (`fatal`)
- DB query failures in service layer (`error`)

## What NOT to Log

- Sensitive data: passwords, tokens, full request bodies containing credentials
- High-frequency low-value events in production (use `debug` level)
- `console.log` / `console.error` / `console.warn` — never, under any circumstances
