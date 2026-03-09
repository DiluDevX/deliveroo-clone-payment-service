#!/bin/bash
# PostToolUse hook: Auto-format files after Edit/Write operations
# Requires: prettier (installed as dev dependency)

FILE_PATH="$CLAUDE_FILE_PATH"

# Skip if no file path provided
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Only format TypeScript/JavaScript/JSON/Markdown files
case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.mjs|*.json|*.md)
    ;;
  *)
    exit 0
    ;;
esac

# Check if prettier is available
if ! command -v npx &>/dev/null; then
  exit 0
fi

# Run prettier on the file
npx prettier --write "$FILE_PATH" 2>/dev/null
exit 0
