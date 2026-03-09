---
description: Stage, review, and create a conventional commit
---

Create a commit following this workflow:

## Step 1 — Understand Changes

Run in parallel:

- `git status` — see all modified and untracked files
- `git diff` — see unstaged changes
- `git diff --cached` — see staged changes
- `git log --oneline -3` — see recent commit style

## Step 2 — Auto-fix Quality Issues

Run sequentially (silently fix before committing):

1. `npm run format:fix` — fix Prettier formatting
2. `npm run lint:fix` — fix ESLint issues
3. `npm run types:check` — verify TypeScript is clean

If `types:check` fails, stop and report the errors — do not commit with type errors.

## Step 3 — Stage Files

Show the user the list of changed files and ask which to include.
Never use `git add .` blindly — stage specific files with `git add <file>`.
Never stage `.env` files or files containing secrets.

## Step 4 — Write Commit Message

Follow Conventional Commits format:

```
<type>(<scope>): <subject>

[optional body]
```

Types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `ci`, `build`
Scope: domain area (e.g., `items`, `auth`, `prisma`, `config`, `middleware`)
Subject: lowercase, present tense, under 72 chars, no trailing period

Match the style of recent commits in `git log`.

## Step 5 — Commit & Verify

Create the commit, then run `git status` and `git log --oneline -3` to confirm success.

## Critical Rules

- NEVER bypass Husky hooks with `--no-verify`
- NEVER commit `.env` files
- NEVER push to remote unless explicitly asked
- NEVER use `git add .` — always stage specific files

$ARGUMENTS
