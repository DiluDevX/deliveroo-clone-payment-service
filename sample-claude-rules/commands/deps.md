---
description: Check dependencies for outdated packages, security issues, or add new ones
---

Manage project dependencies. Use YARN (never npm).

Based on what the user needs ($ARGUMENTS), do one of:

**Check outdated:**

```bash
yarn outdated
```

**Add a dependency:**

```bash
yarn add <package-name>
```

**Add a dev dependency:**

```bash
yarn add -D <package-name>
```

**Security audit:**

```bash
yarn audit
```

Always use `yarn` — this project uses Yarn 4.3.0 (Berry). Never use npm.
