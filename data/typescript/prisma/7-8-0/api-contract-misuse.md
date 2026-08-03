# Security cards

Repository: `https://github.com/prisma/prisma#7.8.0`
Category: api contract misuse

## api contract misuse

### Use Transactional Client Instances Within Interactive Transactions

**Use when**

Executing database operations within Prisma's interactive transactions.

**Secure rules**

**Rule 1: Always use the transaction-specific client instance (tx) provided within the interactive transaction callback, rather than the global Prisma client instance.**

When using Prisma's interactive transactions with the `$transaction` method that accepts an async callback, ensure all database operations inside the callback are performed using the `tx` argument. Using the global `prisma` client instance instead of `tx` will cause operations to execute outside the transaction, potentially leading to race conditions, partial updates, and data integrity issues.

```typescript
await prisma.$transaction(async (tx) => {
  const user = await tx.user.findFirst();
  // Incorrect: await prisma.user.update(...)
  // Correct:
  await tx.user.update({ ... });
});
```


**Source files**

- [`sandbox/tracing/index.ts`](https://github.com/prisma/prisma/blob/7.8.0/sandbox/tracing/index.ts)
