# Security cards

Repository: `https://github.com/drizzle-team/drizzle-orm#0.45.2`
Category: boundary control

## boundary control

### Enforce Tenant and User Boundary Checks in Query Caching Configurations

**Use when**

Applying query caching and custom cache tags in application database queries where data from multiple users or tenants crosses application boundaries.

**Secure rules**

**Rule 1: Incorporate tenant and user identifiers into custom cache tags and maintain auto-invalidation settings.**

When configuring query caching in Gel sessions, ensure custom tags provided in query cache configurations explicitly include tenant or user identifiers to prevent unauthorized cross-tenant data exposure. Additionally, maintain `autoInvalidate` set to `true` when caching queries that rely on table mutation tracking so that cache entries are cleared correctly on insert, update, or delete operations.

```typescript
const userProfile = await db.select()
  .from(users)
  .where(eq(users.id, userId))
  .$withCache({
    tag: `tenant:${tenantId}:user:${userId}`,
    autoInvalidate: true,
  });
```
