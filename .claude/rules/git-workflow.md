# Git Workflow Rules

## Conventional Commits

All commits MUST follow the Conventional Commits format (`@commitlint/config-conventional`).
This is enforced by commitlint + Husky `commit-msg` hook:

```
feat(scope): add new feature
fix(scope): fix a bug
chore(scope): maintenance task
refactor(scope): code restructuring
docs(scope): documentation changes
test(scope): add or update tests
ci(scope): CI/CD configuration changes
build(scope): build system or dependency changes
```

- Subject line under 72 characters, lowercase, no trailing period
- Scope should match the domain area (e.g., `auth`, `items`, `prisma`, `config`)
- Breaking changes: add `BREAKING CHANGE:` footer or `!` after type (`feat!:`)

## Branch Naming

| Prefix      | Purpose                   |
| ----------- | ------------------------- |
| `feature/`  | New features              |
| `fix/`      | Bug fixes                 |
| `chore/`    | Maintenance, deps, config |
| `refactor/` | Code restructuring        |
| `docs/`     | Documentation only        |

## Branch Strategy

| Branch    | Environment        | Notes                             |
| --------- | ------------------ | --------------------------------- |
| `develop` | Development / Beta | Default branch; PRs target here   |
| `main`    | Production         | Only merged from `develop` via PR |

Semantic Release runs on `main` (stable) and `develop` (beta prerelease).

## Versioning

Semantic Release auto-versions from commit history:

- `feat:` → minor version bump (`1.1.0`)
- `fix:` → patch version bump (`1.0.1`)
- `BREAKING CHANGE:` → major version bump (`2.0.0`)
- `chore:`, `docs:`, `refactor:` → no version bump

## Pre-commit Hooks (Husky)

Husky runs automatically on every commit — never bypass with `--no-verify`:

1. `npm run lint:check` — ESLint must pass
2. `npm run types:check` — TypeScript must compile cleanly
3. `npm run format:check` — Prettier formatting must be correct

Fix all failures before committing. Run `npm run lint:fix` and `npm run format:fix` first.

## Package Manager

- ALWAYS use `npm`
- NEVER use `yarn`, `pnpm`, or `bun` — this template is npm-only
- Use `npm install` locally, `npm ci` in CI for reproducible builds
- Add deps: `npm install <pkg>`, dev deps: `npm install -D <pkg>`

## Pull Requests

- PRs to `develop` trigger the `pr-quality-check.yml` workflow (lint + format + types in parallel)
- All checks must pass before merge
- Squash or rebase — keep `develop` history linear
- PR title should follow conventional commits format (used for squash commit message)

## CI/CD

- **`pr-quality-check.yml`** — runs on all PRs to `main`/`develop`
- **`release.yml`** — triggers semantic-release on push to `main`
- **`deploy-ec2.yml`** — manual trigger or on GitHub release publish; deploys to EC2 via Docker + ECR
- **`codeql.yml`** — security scanning on `main`/`develop` and weekly schedule
