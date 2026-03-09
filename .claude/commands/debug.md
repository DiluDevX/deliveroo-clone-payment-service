---
description: Debug an error by tracing through the codebase
---

Debug the following issue: $ARGUMENTS

1. Search the codebase for relevant error messages, function names, or keywords
2. Trace the execution flow from route → middleware → controller → service → database
3. Check the global error handler in `src/middleware/error-handler.middleware.ts`
4. Check the AppError hierarchy in `src/utils/errors.ts`
5. Identify the root cause
6. Suggest a fix with specific file and line references
7. If appropriate, implement the fix

Remember:

- Use `logger` for any debug logging, never `console.log`
- Check validation middleware in route definitions for input-related issues
- Check Prisma error codes (`P2002`, `P2025`) for database-related issues
- Check environment config in `src/config/environment.ts` for config-related issues
