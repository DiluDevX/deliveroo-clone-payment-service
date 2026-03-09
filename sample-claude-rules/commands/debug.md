---
description: Debug an error by tracing through the codebase
---

Debug the following issue: $ARGUMENTS

1. Search the codebase for relevant error messages, function names, or keywords
2. Trace the execution flow from route → controller → service → model
3. Identify the root cause
4. Suggest a fix with specific file and line references
5. If appropriate, implement the fix

Remember:

- Use `logger` for any debug logging, never `console.log`
- Check error handling patterns in `src/exceptions/`
- Check middleware chain in route definitions
