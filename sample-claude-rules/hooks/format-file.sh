#!/bin/bash
# PostToolUse hook: Auto-format files after Edit/Write operations
# Requires: prettier (install via `yarn add -D prettier`)

FILE_PATH="$CLAUDE_FILE_PATH"

# Skip if no file path provided
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Check if prettier is available
if ! command -v npx &>/dev/null || ! npx prettier --version &>/dev/null; then
  echo "WARNING: Prettier is not installed. Run 'yarn add -D prettier' to enable auto-formatting."
  exit 0
fi

# Run prettier on the file
npx prettier --write "$FILE_PATH" 2>/dev/null
exit 0
