---
description: Generate unit tests for a source file using the test-generator agent
---

Generate comprehensive unit tests for the specified source file(s).

## Steps

### 1. Identify the target

Determine which source file(s) need tests based on `$ARGUMENTS`:

- If no arguments given, ask which file to generate tests for
- If a path is given, use that file directly
- If "pr" or "changed" is given, run `git diff --name-only develop...HEAD` to find all changed source files

### 2. Classify files

For each target file, classify as testable or not:

**Testable:** services, database services, controllers, utilities, helpers, validation schemas, middleware
**Not testable:** type-only files (interfaces, DTOs, enums with no logic), config files, model definitions with no custom methods, route definitions with no logic

If no testable files found, report that and stop.

### 3. Check existing test coverage

For each testable file:

- Check if `__tests__/<mirrored-path>.test.ts` already exists
- If tests exist → instruct agent to **extend/update** them, not overwrite
- If no tests exist → instruct agent to **create** new test file
- Also check for shared utilities used by the target that lack test coverage

### 4. Use the test-generator agent

For each testable file, invoke the **test-generator** agent to:

- Analyze the source file and all its exports
- Study 2-3 existing test files for project patterns
- Read project rules (`.claude/rules/testing.md`, `.claude/rules/typescript.md`)
- Build mock data factories with realistic faker data
- Generate tests by file type (service, controller, util, schema)
- Cover: happy path, edge cases, error paths, mock verification
- Target: >85% line coverage, >80% branch coverage
- Run tests and iterate until all pass
- If source code bugs are found, fix the source code first (not the test)

### 5. Report results

Present a summary table:

| File | Tests | Passing | Coverage | Source Fixes |
| ---- | ----- | ------- | -------- | ------------ |

Include:

- Number of test suites and test cases created/updated
- Coverage percentage per file (line, branch, function)
- List of exported functions and whether each is covered
- Any source code bugs found and fixed during testing
- Any functions that couldn't be easily tested and why

$ARGUMENTS
