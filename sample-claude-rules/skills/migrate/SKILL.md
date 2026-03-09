---
name: migrate
description: Create or run Sequelize database migrations
disable-model-invocation: true
allowed-tools: Bash, Read, Write, Edit
---

# Migration Manager

Create or run Sequelize database migrations for the Dinetap Backoffice API.

## Important

**`yarn build` must succeed before any migration command** — the Sequelize CLI config at `config/config.js` imports from `dist/`.

## Usage

### Create a New Migration

1. Build the project first:

```bash
yarn build
```

2. Generate the migration file (use dashes in the description):

```bash
yarn sequelize-cli -y migration:generate --name <description-with-dashes>
```

3. Open the generated file in `src/migrations/` and implement `up` and `down` functions.

### Migration File Template

```javascript
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Implementation here
  },

  async down(queryInterface, Sequelize) {
    // Reverse the up migration here — always implement for reversibility
  },
};
```

### Run Migrations

```bash
yarn build
yarn migrate:up:staging   # For staging
yarn migrate:up:qa        # For QA
```

> **Note:** Production migrations (`yarn migrate:up:prod`) are blocked by safety guardrails and must be run through CI/CD.

### Undo Last Migration

```bash
yarn build
yarn migrate:down
```

## Notes

- Always implement both `up` and `down` functions for reversibility.
- Migration files are in `src/migrations/` with timestamp-prefixed naming.
- Use `queryInterface` methods: `addColumn`, `removeColumn`, `createTable`, `changeColumn`, etc.
- For column types use `Sequelize.DataTypes` (e.g., `Sequelize.DataTypes.STRING`, `Sequelize.DataTypes.INTEGER`).

$ARGUMENTS
