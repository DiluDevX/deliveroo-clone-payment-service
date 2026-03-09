# Git Workflow Rules

## Conventional Commits

All commits MUST follow the conventional commits format (`@commitlint/config-conventional`):

```
feat(scope): add new feature
fix(scope): fix a bug
chore(scope): maintenance task
refactor(scope): code restructuring
docs(scope): documentation changes
test(scope): add or update tests
```

- Subject line under 72 characters
- Scope should match the domain area (e.g., `auth`, `menu`, `order`, `payment`)

## Branch Naming

| Prefix     | Purpose           |
| ---------- | ----------------- |
| `feature/` | New features      |
| `fix/`     | Bug fixes         |
| `chore/`   | Maintenance tasks |
| `release/` | Release branches  |

## Main Branches

| Branch    | Environment                     |
| --------- | ------------------------------- |
| `develop` | Default branch, PRs target here |
| `staging` | Staging environment             |
| `main`    | Production                      |

## Versioning

Semantic Release auto-versions from conventional commits:

- `feat:` → minor version bump
- `fix:` → patch version bump
- `BREAKING CHANGE:` → major version bump

## Pre-commit (Husky)

Husky runs automatically on every commit:

1. `yarn format` — check Prettier formatting
2. `yarn lint` — check ESLint rules
3. `yarn typecheck` — check TypeScript types

If any step fails, the commit is rejected. Fix the issue — never bypass with `--no-verify`.

## Package Manager

- ALWAYS use Yarn 4.3.0 (Berry)
- NEVER use npm — this is enforced by deny rules and PreToolUse hooks
- Use `yarn add <pkg>` for dependencies, `yarn add -D <pkg>` for dev dependencies
