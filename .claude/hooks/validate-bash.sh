#!/bin/bash
# PreToolUse hook: Validates bash commands before execution

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

# If we can't parse the input, allow it
if [ -z "$COMMAND" ]; then
  exit 0
fi

# Block yarn/pnpm/bun usage (must use npm)
if echo "$COMMAND" | grep -qE '(^|\s*[;&|]+\s*)(yarn|pnpm|bun)($|\s)'; then
  echo '{"decision":"block","reason":"This project uses npm. Use npm instead of yarn/pnpm/bun."}'
  exit 0
fi

# Block direct process.env access in source files (should use environment singleton)
if echo "$COMMAND" | grep -qE 'process\.env\.' && echo "$COMMAND" | grep -qE 'src/'; then
  echo '{"decision":"block","reason":"Never access process.env directly. Use the environment singleton from src/config/environment.ts."}'
  exit 0
fi

# Block dropping database tables outside of migrations
if echo "$COMMAND" | grep -qiE 'DROP\s+(TABLE|DATABASE|SCHEMA)'; then
  echo '{"decision":"block","reason":"Dropping tables/databases directly is not allowed. Use Prisma migrations instead."}'
  exit 0
fi

# Block force pushing to protected branches
if echo "$COMMAND" | grep -qE 'git push.*--force.*(main|develop|master)'; then
  echo '{"decision":"block","reason":"Force pushing to main/develop is not allowed."}'
  exit 0
fi

# Block running production migrations directly (use CI/CD pipeline)
if echo "$COMMAND" | grep -qE 'prisma migrate deploy' && echo "$COMMAND" | grep -qiE 'prod'; then
  echo '{"decision":"block","reason":"Running production migrations directly is not allowed. Use the CI/CD pipeline."}'
  exit 0
fi

# Allow everything else
exit 0
