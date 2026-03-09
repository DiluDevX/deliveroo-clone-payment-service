#!/bin/bash
# PreToolUse hook: Validates bash commands before execution
# Exit 0 with JSON = block/allow decision
# Exit 0 without JSON = allow (passthrough)
# Exit 2 = block with error

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

# If we can't parse the input, allow it
if [ -z "$COMMAND" ]; then
  exit 0
fi

# Block npm usage (must use yarn) — catches npm at start or after shell operators (; && ||)
if echo "$COMMAND" | grep -qE '(^|\s*[;&|]+\s*)npm($|\s)'; then
  echo '{"decision":"block","reason":"This project uses Yarn 4.3.0 (Berry). Use yarn instead of npm."}'
  exit 0
fi

# Block dropping database tables outside of migrations
if echo "$COMMAND" | grep -qiE 'DROP\s+(TABLE|DATABASE)'; then
  echo '{"decision":"block","reason":"Dropping tables/databases directly is not allowed. Use Sequelize migrations instead."}'
  exit 0
fi

# Allow everything else
exit 0
