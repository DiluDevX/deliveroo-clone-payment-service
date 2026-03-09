---
description: Show project health status (git, lint, types, build)
---

Give me a quick project health report. Run these in parallel where possible:

1. `git status` — show working tree status
2. `git log --oneline -5` — recent commits
3. `npm run lint:check` — check for lint errors (report count only)
4. `npm run types:check` — check for type errors (report count only)

Present results as a compact status table:

| Check | Status | Details |
| ----- | ------ | ------- |

$ARGUMENTS
