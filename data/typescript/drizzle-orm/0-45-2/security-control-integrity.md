# Security cards

Repository: `https://github.com/drizzle-team/drizzle-orm#0.45.2`
Category: security control integrity

## security control integrity

### Propagate TransactionRollbackError to preserve database transaction integrity

**Use when**

When managing database transactions in SQLite with `db.transaction()` and handling errors inside transaction callbacks.

**Secure rules**

**Rule 1: Do not swallow TransactionRollbackError within custom try/catch blocks inside transaction callbacks.**

Ensure that `tx.rollback()` is permitted to propagate or that `TransactionRollbackError` is explicitly rethrown if caught inside a `try/catch` block. Swallowing this error prevents Drizzle's transaction runner from intercepting the rollback signal, risking partial mutations committing to the SQLite database and state inconsistency.

```typescript
await db.transaction(async (tx) => {
  await tx.insert(auditLogs).values({ action: 'permission_change' });

  try {
    await performSensitiveOperation();
  } catch (error) {
    // Allow TransactionRollbackError or intentional rollbacks to bubble up
    tx.rollback();
  }
});
```
