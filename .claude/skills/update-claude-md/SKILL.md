---
name: update-claude-md
description: Update CLAUDE.md when project patterns, conventions, or architecture change.
disable-model-invocation: false
allowed-tools: Read, Edit, Glob, Grep
---

Update the `CLAUDE.md` file when the project's architecture, conventions, or tooling changes.

## Process

1. **Read current CLAUDE.md** — understand what's documented
2. **Identify what changed** from `$ARGUMENTS`:
   - New dependencies or major version bumps
   - Architectural changes (new layers, patterns, folders)
   - New environment variables
   - Changed commands or scripts
   - New conventions adopted by the team
3. **Find examples** — use Grep/Glob to verify the new patterns exist in actual code
4. **Update relevant sections only** — do not rewrite sections that haven't changed
5. **Verify completeness** — all sections should still be accurate

## Standard Sections to Maintain

| Section               | What it covers                          |
| --------------------- | --------------------------------------- |
| Project Overview      | Tech stack, runtime, package manager    |
| Common Commands       | All npm scripts                         |
| Architecture          | Directory structure, key patterns       |
| Rules                 | Table linking to `.claude/rules/` files |
| Database & Migrations | Prisma workflow                         |
| Important Rules       | Non-negotiable constraints              |

## Constraints

- Keep CLAUDE.md under 150 lines — it's a quick reference, not full documentation
- Detailed conventions belong in `.claude/rules/` files, not in CLAUDE.md
- Code examples should be minimal — just enough to illustrate the pattern
- Every claim in CLAUDE.md should be verifiable in the actual codebase
