# Security cards

Repository: `https://github.com/drizzle-team/drizzle-orm#0.45.2`
Category: resource exhaustion

## resource exhaustion

### Prevent Connection Pool Exhaustion Using Built-in Transaction Wrappers

**Use when**

Executing multi-statement transactional database queries where connection leaks could exhaust the connection pool and cause service downtime.

**Secure rules**

**Rule 1: Always use the ORM's built-in transaction wrapper and properly await transaction callbacks to ensure database connections are safely released back to the pool.**

Always wrap multi-statement operations in `db.transaction()` and ensure the promise is awaited. This guarantees that acquired pool connections are safely released back to the pool in a finally block regardless of whether the transaction succeeds or fails, preventing connection pool exhaustion and query timeouts.

```typescript
try {
  await db.transaction(async (tx) => {
    await tx.insert(users).values({ name: 'Alice' });
    await tx.insert(logs).values({ action: 'created' });
  });
} catch (error) {
  console.error('Transaction failed and was rolled back:', error);
}
```
