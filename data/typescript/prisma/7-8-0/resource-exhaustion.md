# Security cards

Repository: `https://github.com/prisma/prisma#7.8.0`
Category: resource exhaustion

## resource exhaustion

### Limit data fetching to prevent resource exhaustion

**Use when**

When querying data with Prisma, especially for large datasets or complex relationships.

**Secure rules**

**Rule 1: Apply pagination and limit nested data retrieval to prevent excessive resource consumption.**

When fetching data, use pagination with `take` and `skip` (or `cursor` for large datasets) to limit the number of records returned. Additionally, limit the depth and breadth of nested includes or selects to control query complexity and prevent memory or execution time exhaustion. For very large datasets, prefer cursor-based pagination over offset-based pagination (using `skip`) as it scales better.

```typescript
const results = await prisma.user.findMany({
  take: 100,
  skip: 0,
  include: {
    posts: {
      take: 10
    }
  }
});

// For very large datasets, cursor-based pagination is recommended:
const nextBatch = await prisma.post.findMany({
  take: 20,
  cursor: {
    id: lastSeenId,
  },
  orderBy: {
    id: 'asc',
  },
})
```

**Rule 2: Explicitly disconnect PrismaClient when no longer needed to avoid connection leaks.**

In applications that manage PrismaClient instances for specific tasks or have a defined lifecycle, ensure that `prisma.$disconnect()` is called. Failing to do so can lead to connection leaks, exhausting database connection slots and causing a Denial of Service (DoS).

```typescript
const prisma = new PrismaClient();
try {
  // ... perform database operations
} finally {
  await prisma.$disconnect();
}
```


**Source files**

- [`docs/benchmarking.md`](https://github.com/prisma/prisma/blob/7.8.0/docs/benchmarking.md)
- [`docs/plans/benchmark-improvements/003-review-query-performance-benchmarks.md`](https://github.com/prisma/prisma/blob/7.8.0/docs/plans/benchmark-improvements/003-review-query-performance-benchmarks.md)
- [`sandbox/tracing/index.ts`](https://github.com/prisma/prisma/blob/7.8.0/sandbox/tracing/index.ts)
