# Security cards

Repository: `https://github.com/prisma/prisma#7.8.0`
Category: injection

## injection

### Securely Handle User Input in Database Queries

**Use when**

When interacting with the database using Prisma Client, especially when constructing queries with user-provided data.

**Secure rules**

**Rule 1: Always use parameterized queries or the Prisma Client API to prevent SQL injection when handling untrusted input.**

When performing database operations with user-supplied input, ensure that the input is always passed through Prisma's built-in parameterization mechanisms. This includes using the standard Prisma Client methods as shown in the example, or explicitly using tagged template literals with `$queryRaw` and `$executeRaw` for raw SQL, rather than concatenating strings. This prevents untrusted data from being interpreted as SQL commands.

```typescript
await prisma.user.create({
  data: {
    email: userInputEmail,
  },
});

const userId = 123;
const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${userId}`;
```


**Source files**

- [`sandbox/driver-adapters/src/test.ts`](https://github.com/prisma/prisma/blob/7.8.0/sandbox/driver-adapters/src/test.ts)
- [`sandbox/basic-sqlite/index.ts`](https://github.com/prisma/prisma/blob/7.8.0/sandbox/basic-sqlite/index.ts)
- [`docs/plans/benchmark-improvements/003-review-query-performance-benchmarks.md`](https://github.com/prisma/prisma/blob/7.8.0/docs/plans/benchmark-improvements/003-review-query-performance-benchmarks.md)
