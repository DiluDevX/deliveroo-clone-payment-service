# Claude Code Setup - Dinetap Backoffice API

Comprehensive Claude Code configuration with skills, commands, agents, hooks, and MCP integration for the Dinetap Backoffice API (Node.js/Express/TypeScript/Sequelize).

---

## 🚀 Quick Start

### Initial Setup (One-time)

```bash
# 1. Check what's already installed
claude plugin list

# 2. Install any missing plugins (skip if already installed at user scope)
claude plugin install code-simplifier@claude-plugins-official
claude plugin install code-review@claude-plugins-official

# 3. Verify both are listed
claude plugin list
```

> **Note:** If you already have a plugin at user scope, there's no need to install it again at project scope.

### Fix: Duplicate Plugins

If you see plugins listed twice (installed at both user and project scope), remove one:

```bash
# Option A: Keep user scope (available in all projects), remove project scope
claude plugin uninstall <plugin-name> --scope project

# Option B: Keep project scope (only this project), remove user scope
claude plugin uninstall <plugin-name> --scope user
```

### Verify Hooks Are Executable

```bash
chmod +x .claude/hooks/*.sh
```

---

## 📁 What's Included

| Category        | Count         | Purpose                                                              |
| --------------- | ------------- | -------------------------------------------------------------------- |
| **Core Config** | 4 files       | CLAUDE.md, settings.json, .claudeignore, .mcp.json                   |
| **Rules**       | 7 files       | Auto-loaded project conventions (TypeScript, naming, security, etc.) |
| **Skills**      | 8 workflows   | Comprehensive task automation with auto-invocation                   |
| **Commands**    | 6 actions     | Quick project-specific operations                                    |
| **Agents**      | 3 specialists | Code reviewer, test fixer, test generator                            |
| **Hooks**       | 3 events      | Auto-format, bash validation, session summary                        |
| **Plugins**     | 2 official    | Code simplifier, code review                                         |

---

## 📏 Rules (Auto-Loaded Conventions)

Rules in `.claude/rules/` are **automatically loaded every session** with no configuration needed. They provide domain-specific conventions that Claude always follows.

| Rule File               | Purpose                                                                    |
| ----------------------- | -------------------------------------------------------------------------- |
| `typescript.md`         | Strict mode, type safety, never use `any` or `@ts-ignore`, import patterns |
| `naming-conventions.md` | File naming (kebab-case), DTOs, services, models, constants                |
| `error-handling.md`     | Custom exceptions, controller try/catch pattern, HTTP status codes         |
| `logging.md`            | Winston logger, structured format, never `console.log`                     |
| `testing.md`            | Jest + Cypress patterns, mocking, test environment setup                   |
| `security.md`           | Secrets, input validation, auth, never bypass quality checks               |
| `git-workflow.md`       | Conventional commits, branch naming, Husky pre-commit, yarn only           |

**How it works:**

- Rules are loaded **automatically** — no configuration or imports needed
- They have the **same priority** as CLAUDE.md in Claude's context
- Edit a rule file → Claude uses updated rules on next session
- Rules complement skills: rules say **what to follow**, skills say **how to do tasks**

---

## 🎯 Skills (Comprehensive Workflows)

Skills are AI-powered workflows that Claude can invoke automatically or you can trigger manually with `/skill-name`.

### `/test` - Test Runner

**Capabilities:**

- Run unit tests only (`yarn test:unit`)
- Run E2E tests with Docker setup (`yarn test:db:up && yarn test:e2e`)
- Run full test suite with coverage
- Watch mode for TDD (`yarn test:unit:watch`)
- Automatic environment detection (checks for `.env.test`)

**Use cases:**

- After code changes: `/test unit`
- Before PR: `/test` (full suite)
- During development: `/test watch`

**Auto-invocation:** No (you control when tests run)

---

### `/migrate` - Migration Manager

**Capabilities:**

- Create new Sequelize migrations with proper templates
- Run migrations on QA/staging/prod
- Undo migrations safely
- Pre-flight build validation (ensures `yarn build` succeeds)
- Migration file templates with up/down functions

**Use cases:**

- Add column: `/migrate create add-user-phone-column`
- Deploy staging: `/migrate up staging`
- Rollback: `/migrate down`

**Auto-invocation:** No (migrations are critical operations)

**Important:** Always builds project first (config reads from `dist/`)

---

### `/review` - Code Review

**Capabilities:**

- Identifies changed files via git diff
- Runs automated checks (lint, typecheck, format)
- Reviews against project-specific checklist:
  - No `console.log` (must use `logger`)
  - Controllers delegate to services
  - Proper error handling with custom exceptions
  - Request validation via AJV schemas
  - DTOs for all request/response types
  - Auth middleware applied correctly
  - Tests for new code

**Use cases:**

- Before committing: `/review`
- After feature work: `/review staged`
- PR self-review: `/review`

**Auto-invocation:** No (manual code review workflow)

---

### `/quality-checks` - Pre-Deployment Validation

**Capabilities:**

- Sequential validation pipeline:
  1. `yarn format` - Check formatting
  2. `yarn lint` - Check linting
  3. `yarn typecheck` - Check types
  4. `yarn build` - Verify compilation
  5. `yarn test:unit` - Run tests
- Reports pass/fail for each step
- Stops on first failure with error details
- Suggests fixes for common issues

**Use cases:**

- Before pushing to remote: `/quality-checks`
- Pre-deployment gate: `/quality-checks`
- After major refactoring: `/quality-checks`

**Auto-invocation:** No (you control quality gates)

---

### `/create-endpoint` - API Scaffolding

**Capabilities:**

- Scaffolds complete API endpoint:
  - Controller (`src/controllers/v1/<name>.controller.ts`)
  - Service (`src/services/<name>.service.ts`)
  - Database service (`src/services/<name>.database.service.ts`)
  - DTO (`src/dto/<name>.dto.ts`)
  - Schema (`src/schema/<name>.schema.ts`)
  - Route (`src/routes/v1/<name>.routes.ts`)
- Follows existing patterns (reads similar files)
- Wires up middleware (auth, validation)
- Uses TypeScript with proper typing

**Use cases:**

- New feature: `/create-endpoint restaurant`
- New resource: `/create-endpoint payment-method`

**Auto-invocation:** No (explicit scaffolding operation)

---

### `/create-migration` - Migration Scaffolding

**Capabilities:**

- Generates Sequelize migration file
- Fills in template based on description
- Includes both up and down functions
- Provides common operation examples:
  - Add/remove columns
  - Create/drop tables
  - Add indexes
  - Change column types

**Use cases:**

- Schema changes: `/create-migration add-restaurant-logo-url`
- New tables: `/create-migration create-payment-methods-table`

**Auto-invocation:** No (database changes need explicit control)

---

### `api-conventions` - Background Knowledge (Auto-loaded)

**Capabilities:**

- Automatically loaded when Claude works on API code
- Enforces project patterns:
  - Controller structure (try/catch + next(error))
  - Service separation (_.service.ts vs _.database.service.ts)
  - DTO naming conventions
  - AJV schema validation pattern
  - Route definition with middleware
  - Error handling with custom exceptions

**Use cases:**

- Claude reads this automatically when creating endpoints
- Provides context for code generation
- Ensures consistency with existing patterns

**Auto-invocation:** Yes (Claude loads automatically)
**User-invocable:** No (background knowledge only)

---

### `/update-claude-md` - Documentation Maintenance

**Capabilities:**

- Updates CLAUDE.md when patterns change
- Searches codebase to find examples
- Validates conventions against actual code
- Keeps documentation concise (under 200 lines)
- Maintains structured sections

**Use cases:**

- After architectural changes: `/update-claude-md Added global error handler`
- New conventions: `/update-claude-md Updated DTO naming pattern`
- New commands: `/update-claude-md Added deployment script`

**Auto-invocation:** Yes (when project conventions change)

---

## ⚡ Commands (Quick Actions)

Commands are simpler single-file operations for quick tasks.

### `/fix` - Auto-fix Issues

**What it does:**

1. `yarn format:fix` - Fix Prettier formatting
2. `yarn lint:fix` - Auto-fix ESLint issues
3. `yarn typecheck` - Verify types

**Reports:** Files changed, remaining manual fixes

---

### `/status` - Project Health

**What it does:**

- Git status (working tree)
- Recent commits (last 5)
- Lint check (error count)
- Type check (error count)

**Output:** Compact table with status of each check

---

### `/debug` - Error Investigation

**What it does:**

1. Searches codebase for error messages/keywords
2. Traces execution: route → controller → service → model
3. Identifies root cause
4. Suggests fix with file:line references
5. Optionally implements the fix

**Remembers:**

- Use `logger`, never `console.log`
- Check `src/exceptions/` for error patterns
- Review middleware chain

---

### `/commit` - Smart Commit

**What it does:**

1. Reviews all staged and unstaged changes
2. Auto-fixes formatting and lint issues (`yarn format:fix`, `yarn lint:fix`)
3. Verifies types (`yarn typecheck`)
4. Runs **code-reviewer** agent to catch bugs, security issues, pattern violations
5. Fixes any issues found by the reviewer
6. Stages specific files and commits with conventional commit format

**Safety:** Never pushes to remote, never uses `git add .`, never commits secrets

---

### `/generate-tests` - Test Generator

**What it does:**

1. Reads the target source file and understands all exported functions
2. Studies existing test patterns in the project
3. Uses the **test-generator** agent to create comprehensive tests
4. Writes test file at correct path (`__tests__/` mirroring `src/` structure)
5. Runs tests to verify they pass, fixes any failures

**Coverage:** Happy path, edge cases, error paths, and mock verification for every exported function

**Usage:** `/generate-tests src/services/employee.database.service.ts`

---

### `/deps` - Dependency Management

**What it does:**

- Check outdated: `yarn outdated`
- Add dependency: `yarn add <package>`
- Add dev dependency: `yarn add -D <package>`
- Security audit: `yarn audit`

**Enforces:** Always yarn (never npm)

---

## 🤖 Agents (Specialized Sub-agents)

Agents are isolated AI assistants with specific expertise and tool restrictions.

### `code-reviewer` - Read-Only Code Analyst

**Capabilities:**

- **Tools:** Read, Grep, Glob, Bash (no Write/Edit)
- **Model:** Sonnet (fast, cost-effective)
- **Skills preloaded:** api-conventions

**Review checklist:**

- No `console.log` usage
- Controllers delegate to services
- Database access only in `*.database.service.ts`
- Custom exceptions for errors
- AJV validation applied
- DTOs for request/response
- Auth middleware on protected routes
- No SQL injection vulnerabilities
- TypeScript strict mode compliance

**How to use:**

- Ask: "Review my recent changes"
- Ask: "Check this controller for bugs"
- Auto-invoked after major code changes

---

### `test-fixer` - Test Diagnosis & Repair

**Capabilities:**

- **Tools:** Read, Write, Edit, Bash, Grep, Glob
- **Model:** Sonnet (fast iteration)
- **Skills preloaded:** api-conventions

**Process:**

1. Runs `yarn test:unit`
2. Identifies failures
3. Reads test files and source
4. Fixes implementation or test expectations
5. Re-runs tests to verify
6. Reports results

**How to use:**

- Ask: "Fix the failing tests"
- Ask: "Why is the employee test failing?"
- Auto-invoked when tests break after code changes

---

### `test-generator` - Test Creation Specialist

**Capabilities:**

- **Tools:** Read, Write, Edit, Bash, Grep, Glob
- **Model:** Sonnet (fast iteration)
- **Skills preloaded:** api-conventions

**Process:**

1. Reads source file, understands all exported functions
2. Studies 1-2 similar existing tests for project patterns
3. Generates tests with faker data, jest.spyOn mocks
4. Writes test file mirroring `src/` structure in `__tests__/`
5. Runs tests to verify they pass
6. Iterates until all tests are green

**How to use:**

- Command: `/generate-tests src/services/my-service.ts`
- Ask: "Generate tests for the payment service"
- Ask: "Add tests for the new endpoint I created"

---

## 🪝 Hooks (Automation)

Hooks run automatically at specific lifecycle events.

### PostToolUse (Edit/Write) → Auto-format

**Triggers:** After any Edit or Write operation
**Action:** Runs `npx prettier --write` on the modified file
**Purpose:** Keep code formatted during Claude sessions
**Fallback:** Husky pre-commit still runs format+lint+typecheck

---

### PreToolUse (Bash) → Command Validator

**Triggers:** Before any Bash command
**Script:** `.claude/hooks/validate-bash.sh`

**Blocks:**

- `npm` commands (enforces yarn usage)
- `DROP TABLE`/`DROP DATABASE` statements (must use migrations)
- Can be extended for more validations

**Allows:** Everything else (exit 0)

**Purpose:** Enforce project rules before execution

---

### Stop → Session Summary

**Triggers:** When Claude finishes responding
**Script:** `.claude/hooks/stop-summary.sh`
**Current:** Empty (placeholder for audit logging)
**Future:** Can log session activity, remind about quality checks

---

## 🔒 Permissions & Security

### Auto-Approved (No Prompts)

✅ Safe commands that don't modify state:

- `yarn lint`, `yarn format`, `yarn typecheck`
- `yarn test`, `yarn test:unit`, `yarn test:e2e`
- `yarn build`
- `git status`, `git diff`, `git log`
- `gh *` (GitHub CLI)
- `npx prettier --write` (for hooks)

### Blocked (Safety Guardrails)

❌ Dangerous operations that can cause data loss:

- **Reading secrets:** `Read(.env)`, `Read(.env.local)`, `Read(.env.staging)`, `Read(.env.prod)`, `Read(.env.qa)`
- **Destructive commands:** `rm -rf *`
- **Git dangers:** `git push --force`, `git reset --hard`
- **Production risks:** `yarn migrate:up:prod`
- **Wrong package manager:** `npm *` (must use yarn)

### Behavior

- Blocked commands show reason immediately
- Safe commands run without permission dialog
- Everything else prompts for approval

---

## 🔌 MCP Integration

### GitHub MCP (Configured)

**File:** `.mcp.json`
**Server:** `https://api.githubcopilot.com/mcp/`

**Capabilities:**

- Create/update pull requests
- Read issues and comments
- Review code in PRs
- Manage branches
- Access repository metadata

**Setup required:**

```bash
# Option 1: Environment variable
export GITHUB_TOKEN=ghp_your_token_here

# Option 2: GitHub CLI (preferred)
gh auth login
```

**Use cases:**

- Ask: "Create a PR for this branch"
- Ask: "Show me issue #123"
- Ask: "Review the latest PR"

---

## 🎨 Official Plugins

### code-simplifier@claude-plugins-official

**Purpose:** Simplify complex code into readable patterns
**Triggers:** When code becomes too complex
**Actions:** Refactors for readability, extracts functions, removes duplication

### code-review@claude-plugins-official

**Purpose:** Enhanced PR review capabilities
**Triggers:** During PR creation/review
**Actions:** Analyzes changes, suggests improvements, checks conventions

> **Note:** This is different from the custom `code-reviewer` **agent** (see Agents section). The plugin is a general-purpose marketplace tool; the agent is project-specific with our review checklist baked in.

---

## 📊 Usage Examples

### Daily Development

```
# Start work
/status                          # Check project health

# Make changes
<edit files>                     # Auto-formatted via PostToolUse hook

# Before committing
/fix                             # Auto-fix lint/format issues
/test unit                       # Run affected tests
/review                          # Self-review changes

# Commit (reviews, fixes, and commits in one step)
/commit                          # Smart commit with auto-cleanup
```

### New Feature

```
# Scaffold
/create-endpoint payment-method  # Generate all endpoint files

# Implement
<write business logic>

# Database changes
/create-migration add-payment-method-table
/migrate up qa                   # Deploy to QA

# Quality gate
/quality-checks                  # Full validation
```

### Debugging

```
# Investigate
/debug "Employee login fails with 500 error"

# Trace execution
<Claude searches, reads files, identifies issue>

# Fix
<Claude suggests or implements fix>

# Verify
/test unit
```

### Code Review

```
# Self-review
/review

# Team review (via agent)
Ask: "Review my changes for security issues"
# → Triggers code-reviewer agent

# Fix issues
<make changes>

# Re-run tests
/test
```

---

## 🛠️ Troubleshooting

### Plugins Not Working

**Symptom:** Skills from plugins don't appear in `/help`

**Solution:**

```bash
# Check current state
claude plugin list

# Re-enable (omit --scope to auto-detect where they're installed)
claude plugin enable code-simplifier@claude-plugins-official
claude plugin enable code-review@claude-plugins-official

# If that fails with scope error, specify the scope where they're installed:
claude plugin enable <plugin-name> --scope user    # if installed at user scope
claude plugin enable <plugin-name> --scope project # if installed at project scope
```

### Duplicate Plugins

**Symptom:** Same plugin appears twice in the plugin manager

**Cause:** Plugin was installed at both user scope (`~/.claude/`) and project scope (`.claude/`)

**Solution:** Remove from one scope:

```bash
# Keep whichever scope you prefer, remove the other
claude plugin uninstall <plugin-name> --scope user     # remove user-scope copy
# OR
claude plugin uninstall <plugin-name> --scope project  # remove project-scope copy
```

### Hooks Not Running

**Symptom:** Prettier doesn't auto-format, bash commands not validated

**Solution:**

```bash
# Make scripts executable
chmod +x .claude/hooks/validate-bash.sh
chmod +x .claude/hooks/format-file.sh
chmod +x .claude/hooks/stop-summary.sh

# Verify
ls -la .claude/hooks/
```

### Skills Not Showing

**Symptom:** `/test` or other skills return "Unknown skill"

**Solution:**

- Restart Claude Code session (close and reopen terminal)
- Run `/help` to refresh skill list
- Check skill files exist: `ls -la .claude/skills/*/SKILL.md`

### Permission Denied Errors

**Symptom:** Allowed commands still prompt for permission

**Solution:**

- Check `.claude/settings.json` syntax
- Restart Claude Code
- Verify pattern matches: `Bash(yarn lint)` vs `Bash(yarn lint*)`

### MCP GitHub Not Working

**Symptom:** "GitHub MCP not available" errors

**Solution:**

```bash
# Authenticate with GitHub CLI
gh auth login

# Or set token
export GITHUB_TOKEN=ghp_your_token_here

# Restart Claude Code
```

---

## 📚 Documentation

- **[CLAUDE.md](../CLAUDE.md)** - Project context (read by Claude on every session)
- **[Rules](./rules/)** - Auto-loaded project conventions (7 rule files)
- **[Skills](./skills/)** - Individual skill documentation
- **[Commands](./commands/)** - Command definitions
- **[Agents](./agents/)** - Agent configurations
- **[Hooks](./hooks/)** - Hook scripts

---

## 🔄 Keeping Up-to-Date

### When Project Changes

Use the `/update-claude-md` skill:

```
/update-claude-md Added new deployment script for Docker
/update-claude-md Changed DTO naming convention to include version
/update-claude-md Updated test setup to use fixtures
```

### When Patterns Evolve

Claude will prompt you or auto-update via the `update-claude-md` skill when it detects pattern changes during code generation.

### When Adding Skills

1. Create `SKILL.md` in `.claude/skills/<name>/`
2. Update this README's Skills section
3. Commit changes
4. Team members get updates on next pull

---

## 👥 Team Onboarding

When a new developer joins:

1. **Clone repo** - `.claude/` directory is included
2. **Install plugins** - Run commands from Quick Start section
3. **Read this README** - Understand available capabilities
4. **Try a command** - Run `/status` to verify setup
5. **Review CLAUDE.md** - Learn project conventions

Everything else works automatically - hooks, permissions, agents are pre-configured.

---

## 📈 Benefits

### For Developers

- ⚡ **Faster workflows** - Commands automate repetitive tasks
- 🔍 **Better code quality** - Auto-review catches issues early
- 📝 **Consistent patterns** - Skills enforce project conventions
- 🛡️ **Fewer mistakes** - Deny rules prevent dangerous operations
- 🤖 **Smart assistance** - Agents provide specialized expertise

### For Teams

- 📦 **Shareable config** - Check into git, everyone gets same setup
- 📖 **Self-documenting** - CLAUDE.md explains project to AI and humans
- 🔐 **Security guardrails** - Prevent accidental exposure of secrets
- 🎯 **Standardization** - Everyone uses same scaffolding patterns
- 🚀 **Onboarding** - New devs productive faster with AI assistance

---

## 🆘 Getting Help

- **Claude Code docs:** https://code.claude.com/docs
- **List all skills:** `/help`
- **Skill details:** Read `.claude/skills/<name>/SKILL.md`
- **Test configuration:** `/status` (health check)
- **Update docs:** `/update-claude-md <what changed>`

---

_Generated with Claude Code_
