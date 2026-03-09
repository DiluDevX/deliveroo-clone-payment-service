---
description: Show project health status (git, lint, types, tests)
---

Give me a quick project health report. Run these in parallel where possible:

1. `git status` — show working tree status
2. `git log --oneline -5` — recent commits
3. `yarn lint` — check for lint errors (report count only)
4. `yarn typecheck` — check for type errors (report count only)

Present results as a compact status table:

| Check | Status | Details |
| ----- | ------ | ------- |

$ARGUMENTS
