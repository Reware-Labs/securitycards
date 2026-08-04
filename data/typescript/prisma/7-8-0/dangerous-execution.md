# Security cards

Repository: `https://github.com/prisma/prisma#7.8.0`
Category: dangerous execution

## dangerous execution

### Avoid Unsafe Raw SQL Execution

**Use when**

When executing raw SQL queries or commands directly against the database.

**Secure rules**

**Rule 1: Use parameterized raw SQL queries instead of unsafe, unparameterized execution, especially with external input.**

Prisma provides safe methods for executing raw SQL. Always use parameterized queries when including dynamic data, and avoid methods that execute unparameterized SQL strings, as they are susceptible to SQL injection. Leverage Prisma Client's type-safe methods for most operations.

```typescript
await prisma.$queryRaw`SELECT * FROM User WHERE id = ${userId}`
```


**Source files**

- [`sandbox/studio/prisma.config.ts`](https://github.com/prisma/prisma/blob/7.8.0/sandbox/studio/prisma.config.ts)
