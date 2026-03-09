---
name: create-migration
description: Create a new Sequelize migration with proper up/down functions
disable-model-invocation: true
allowed-tools: Bash, Read, Write, Edit
argument-hint: '[migration-description]'
---

# Create Migration

Create a new Sequelize migration based on the user's description.

## Steps

1. **Build the project** (required for Sequelize CLI config):

```bash
yarn build
```

2. **Generate the migration file** (use dashes in the name):

```bash
yarn migrate:create
# When prompted, enter the description with dashes (e.g., add-user-phone-column)
```

3. **Implement the migration** in the generated file at `src/migrations/`:

### Template

```javascript
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Implementation
  },

  async down(queryInterface, Sequelize) {
    // Reverse — always implement for rollback safety
  },
};
```

### Common Operations

**Add column:**

```javascript
await queryInterface.addColumn('TableName', 'columnName', {
  type: Sequelize.DataTypes.STRING,
  allowNull: true,
  defaultValue: null,
});
```

**Remove column:**

```javascript
await queryInterface.removeColumn('TableName', 'columnName');
```

**Create table:**

```javascript
await queryInterface.createTable('TableName', {
  id: { type: Sequelize.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: Sequelize.DataTypes.STRING, allowNull: false },
  createdAt: { type: Sequelize.DataTypes.DATE, allowNull: false },
  updatedAt: { type: Sequelize.DataTypes.DATE, allowNull: false },
});
```

**Change column:**

```javascript
await queryInterface.changeColumn('TableName', 'columnName', {
  type: Sequelize.DataTypes.TEXT,
  allowNull: true,
});
```

**Add index:**

```javascript
await queryInterface.addIndex('TableName', ['columnName'], { name: 'idx_table_column' });
```

## Notes

- Always implement both `up` and `down` for reversibility.
- Check existing models in `src/models/` to understand table structure before modifying.
- If adding a column that corresponds to a model, update the model file too.

$ARGUMENTS
