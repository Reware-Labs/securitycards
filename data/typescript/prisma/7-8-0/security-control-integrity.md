# Security cards

Repository: `https://github.com/prisma/prisma#7.8.0`
Category: security control integrity

## security control integrity

### Ensure Transactional Integrity with Explicit Isolation Levels

**Use when**

When performing sensitive database operations that require strict data consistency and atomicity, especially within transactions.

**Secure rules**

**Rule 1: Enforce strict isolation levels for sensitive transactional operations to prevent race conditions and data corruption.**

When executing a series of dependent database operations that must be isolated from concurrent modifications, explicitly configure the 'Serializable' isolation level for transactions. This prevents phenomena like non-repeatable reads or phantom reads, ensuring data consistency for security-sensitive logic.

```typescript
await prisma.$transaction(
  [prisma.child.count()],
  {
    isolationLevel: 'Serializable'
  }
)
```

**Rule 2: Execute dependent database operations within atomic interactive transactions to guarantee data consistency and atomicity.**

To prevent inconsistent database states that could lead to business logic bypasses or data corruption, wrap related operations within a `$transaction` block. Use an async callback within `$transaction` to ensure that if any part of a complex operation fails, the entire set of changes is rolled back atomically.

```typescript
await prisma.$transaction(async (tx) => {
  const author = await tx.author.create({ data: { ... } });
  await tx.post.create({ data: { authorId: author.id, ... } });
})
```


**Source files**

- [`sandbox/driver-adapters/src/test.ts`](https://github.com/prisma/prisma/blob/7.8.0/sandbox/driver-adapters/src/test.ts)
