# Security cards

Repository: `https://github.com/drizzle-team/drizzle-orm#0.45.2`
Category: api contract misuse

## api contract misuse

### Propagate TransactionRollbackError and handle unsupported driver transactions correctly

**Use when**

When writing transactional boundaries and executing multi-statement operations across various database drivers in Drizzle ORM.

**Secure rules**

**Rule 1: Avoid invoking transactions on drivers that do not support interactive transactions.**

Do not invoke db.transaction() when using the neon-http driver or the MySQL Proxy session driver, as these drivers throw explicit runtime errors. Use db.batch() or non-transactional query execution instead.

```typescript
await db.batch([
  db.insert(users).values({ name: 'Alice' }),
  db.insert(auditLogs).values({ event: 'USER_CREATED' }),
]);
```
