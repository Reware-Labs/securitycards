# Security blueprint

Repository: `https://github.com/sequelize/sequelize#v6.37.8`

## Security posture

When developing applications with Sequelize, rely on structured query objects and parameterization to protect against injection vulnerabilities and unauthorized data exposure. The framework automatically escapes parameter values within standard `where` clauses and replacement maps, but developers must explicitly validate inputs, handle database transactions correctly, and avoid unsafe escape hatches. Security-sensitive surfaces include raw SQL queries, connection strings, model definitions, and lifecycle boundaries, where configuration and input validation mistakes should always fail closed.

## Essential implementation rules

1. **Use Structured Where Objects and Replacements for Safe Querying**

Always rely on object-based `where` filter criteria and parameterized queries using `replacements` or `bind` options in `sequelize.query()` to safely parse inputs outside of string literals and prevent SQL injection.

2. **Avoid Unsafe Raw SQL Escape Hatches**

Do not pass untrusted user input to `Sequelize.literal()` because it inserts arbitrary content without automatic escaping. Use structured query operators or parameterized queries instead.

3. **Pass Database Configuration via Structured Explicit Options**

Avoid constructing database connection URLs from untrusted input. Use structured explicit options objects and static environment variables to prevent query string parameter overrides of security settings, SSL configurations, or host targets.

4. **Enforce Strict Input Contracts and Type Validation**

Define strict data types such as `DataTypes.ENUM` or explicit length-bound `STRING`s on model attributes, and enable `typeValidation: true` on the Sequelize instance to enforce attribute data type checking prior to model operations.

5. **Validate and Sanitize Query and Association Parameters**

Sanitize user-controlled attribute projections to ensure they are formatted strictly as two-element arrays `['column', 'alias']`, avoid passing `undefined` variables inside `where` condition objects, and define explicit through models for `belongsToMany` associations with validation rules.

6. **Ensure Model Validations and Lifecycle Hooks Run on Mutations**

Explicitly pass `{ validate: true }` on `Model.bulkCreate()` operations and retain default validation on `Model.upsert()` to ensure model-defined validation rules execute on untrusted inputs.

7. **Manage Transaction Lifecycle and Callbacks Correctly**

Prefer managed transactions via `sequelize.transaction()` to automatically handle lifecycle completion, do not execute queries using transaction handles after commit or rollback, and verify that post-commit callback handlers passed to `t.afterCommit(fn)` are functions.

8. **Disable Forceful Schema Synchronization in Production**

Never invoke `sync({ force: true })` or `sync({ alter: true })` in production environments to prevent unintended data destruction, table drops, or column alterations.

9. **Secure Secrets and Exclude Confidential Attributes**

Use Sequelize's `beforeConnect` hook to asynchronously obtain rotating database passwords, define default model scopes to exclude confidential attributes from queries, and use `DataTypes.VIRTUAL` for sensitive raw values.

10. **Prevent Resource Exhaustion and Memory Issues**

Configure `dialectOptions.maxRows` explicitly on database connection options to cap row limits and prevent Node.js heap exhaustion caused by unconstrained query results.
