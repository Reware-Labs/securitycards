# Security cards

Repository: `https://github.com/typeorm/typeorm#1.1.0`
Category: boundary control

## boundary control

### Route Security-Critical Read Queries to Master Node

**Use when**

When performing queries that evaluate access control checks or rely on recently written state in a replicated database environment.

**Secure rules**

**Rule 1: Explicitly route security-critical read queries to the master node to prevent evaluation against stale slave data.**

When using database replication, TypeORM routes read queries to random slave nodes by default. For queries that perform access control checks or rely on recently written state, instantiate a query runner targeting the master explicitly or configure the default mode to master to ensure trust transition checks evaluate against up-to-date state.

```typescript
const masterQueryRunner = dataSource.createQueryRunner("master");
try {
    const user = await dataSource
        .createQueryBuilder(User, "user", masterQueryRunner)
        .where("user.id = :id", { id: userId })
        .getOne();
} finally {
    await masterQueryRunner.release();
}
```
