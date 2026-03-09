---
name: update-claude-md
description: Update CLAUDE.md when project patterns, conventions, or architecture change. Use after adding new features, changing workflows, or updating project standards.
disable-model-invocation: false
allowed-tools: Read, Edit, Glob, Grep
---

# Update CLAUDE.md

Keep the project context file (CLAUDE.md) up-to-date with the latest project information.

## When to Update

Update CLAUDE.md when:

- New architectural patterns are introduced
- Code conventions change
- New commands or scripts are added to package.json
- Project structure changes (new directories, refactoring)
- Testing setup changes
- Database migration process changes
- Important project rules are established

## Update Process

1. **Read current CLAUDE.md**

   ```bash
   Read CLAUDE.md
   ```

2. **Identify what changed** based on user's description: $ARGUMENTS

3. **Find relevant examples** in the codebase to validate changes:
   - Search for new patterns with Grep
   - Find new files/directories with Glob
   - Read representative files to understand conventions

4. **Update CLAUDE.md sections**:
   - Keep existing structure
   - Add/update relevant sections only
   - Keep it concise (Claude reads this on every session start)
   - Use examples from actual code

5. **Verify completeness**:
   - Does it capture the new pattern/convention?
   - Is it actionable (clear enough for Claude to follow)?
   - Does it align with existing project style?

## CLAUDE.md Structure

Maintain these sections:

1. **Project Overview** - Tech stack, runtime, package manager
2. **Common Commands** - All yarn commands
3. **Architecture** - Layers, flow, patterns
4. **Code Conventions** - Formatting, linting, naming
5. **Git Workflow** - Branches, commits, pre-commit hooks
6. **Testing** - Unit, E2E, coverage
7. **Database & Migrations** - Sequelize, migration process
8. **Important Rules** - Never use console.log, never use npm, etc.

## Notes

- Keep CLAUDE.md under 200 lines (after that it gets truncated)
- Focus on patterns Claude needs to follow when coding
- Include concrete examples where helpful
- Link to other documentation for details

$ARGUMENTS
