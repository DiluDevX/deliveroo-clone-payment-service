---
description: Check dependencies for outdated packages, security issues, or add new ones
---

Manage project dependencies. Use npm (never yarn or pnpm).

Based on what the user needs ($ARGUMENTS), do one of:

**Check outdated:** `npm outdated`
**Add a dependency:** `npm install <package-name>`
**Add a dev dependency:** `npm install -D <package-name>`
**Security audit:** `npm audit`
**Fix audit issues:** `npm audit fix`

Always use `npm` — this project uses npm. Never use yarn, pnpm, or bun.

After adding any dependency, run `npm run types:check` to verify no type conflicts.
