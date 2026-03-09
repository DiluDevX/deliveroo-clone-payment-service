---
description: Review changes, auto-fix quality issues, interactively review code, and commit with conventional format
---

Create a clean, high-quality commit by auto-fixing quality issues and interactively reviewing code before committing.

## Steps

### 1. Understand the changes

Run in parallel:

- `git status` — see all changed/untracked files
- `git diff --stat` — summary of changes
- `git diff` — full diff of unstaged changes
- `git diff --cached` — full diff of staged changes

### 2. Auto-fix quality issues (no user input needed)

These are mechanical fixes — apply them silently:

1. `yarn format:fix` — fix Prettier formatting
2. `yarn lint:fix` — auto-fix ESLint issues
3. `yarn typecheck` — check for type errors

If typecheck or lint still has errors after auto-fix, **fix the actual code** to resolve them. Move to step 3 only when all quality checks pass.

### 3. Interactive code review

Use the **code-reviewer** agent to review the changes. For each issue found:

1. **Explain the issue clearly** — what's wrong, where it is (file:line), and why it matters
2. **Suggest the fix** — show what the code should look like
3. **Ask the user** what to do using AskUserQuestion with options:
   - "Fix it" — apply the suggested change
   - "Skip" — leave as-is and move to the next issue
     The user can also type their own fix via the "Other" option — if they do, apply their suggestion instead

**Review checklist:**

- No `console.log` usage (must use `logger`)
- Controllers delegate to services properly
- Custom exceptions for error handling (not generic `throw new Error()`)
- AJV validation schemas present where needed
- DTOs for request/response types
- Auth middleware on protected routes
- No security vulnerabilities (SQL injection, XSS)
- No dead code or unused imports
- Proper async/await and error propagation

Present issues **one at a time** so the user can decide on each.

### 4. Re-verify after fixes

If any files were modified in steps 2-3:

- `yarn format:fix` — re-format any changed files
- `yarn lint` — confirm no lint errors
- `yarn typecheck` — confirm no type errors

If new errors appear, fix them (go back to step 2 logic). Do NOT proceed until all checks pass.

### 5. Confirm files to commit

Show the user the full list of files that will be committed (changed + untracked). Then ask using AskUserQuestion:

- "Commit all" — stage and commit everything listed
- "Exclude some" — let the user specify which files to skip

If the user chooses to exclude files, ask them which files to omit (via the "Other" option), then only stage the remaining files.

### 6. Stage and commit

1. `git add` only the confirmed files (never `git add .`)
2. `git log --oneline -5` — read recent commits to match commit message style
3. Draft a commit message following **conventional commits** format:
   - `feat(scope): description` for new features
   - `fix(scope): description` for bug fixes
   - `chore(scope): description` for maintenance
   - `refactor(scope): description` for refactoring
   - Keep the subject line under 72 characters
   - Add a body if the changes are complex
4. Create the commit

### 7. Post-commit verification

- `git status` — confirm clean working tree
- `git log --oneline -3` — show the new commit

## Critical Rules

### NEVER bypass quality checks

- Do NOT add `// eslint-disable` or `// eslint-disable-next-line` to suppress lint errors
- Do NOT add `// @ts-ignore` or `// @ts-expect-error` to suppress type errors
- Do NOT add `/* prettier-ignore */` to skip formatting
- Do NOT add `any` type to fix TypeScript errors
- Do NOT add empty catch blocks to silence errors
- ALWAYS fix the root cause of the issue in the actual code

### Safety

- Do NOT push to remote — only commit locally
- Do NOT use `git add .` or `git add -A` — stage specific files
- Do NOT commit `.env` files or secrets
- If Husky pre-commit hook fails, fix the issue and create a NEW commit (never `--amend` unless explicitly asked)
- If there are no changes to commit, report that and stop

$ARGUMENTS
