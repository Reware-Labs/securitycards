# Security cards

Repository: `https://github.com/prisma/prisma#7.8.0`
Category: access control

## access control

### Enforce Access Control with Ownership and Role Checks

**Use when**

When implementing data access logic in applications using Prisma, especially for operations that modify or retrieve sensitive information.

**Secure rules**

**Rule 1: Verify that the authenticated actor has the necessary permissions (e.g., ownership, role) before allowing an action on a resource.**

Before performing any database operation that could expose or modify sensitive data, ensure that the current user or tenant has the explicit permission to do so. This prevents unauthorized access and cross-tenant data leakage. For example, when updating a record, always check if the authenticated user is the owner of that record.

**Rule 2: Use tenant-specific Prisma Client extensions when implementing multi-tenant data isolation.**

Use Prisma Client's `query` extension component to create an independent extended client customized for a specific user or tenant, such as by binding the client to the appropriate filter. Prisma documents this as a way to implement user isolation, including through a PostgreSQL row-level security (RLS) extension. Ensure application code uses the appropriately scoped client; Prisma does not automatically add tenant filters to every query.


**Source files**

- [`.github/workflows/test.yml`](https://github.com/prisma/prisma/blob/7.8.0/.github/workflows/test.yml)
- [`.github/workflows/scripts/auto-close-github-discussions.js`](https://github.com/prisma/prisma/blob/7.8.0/.github/workflows/scripts/auto-close-github-discussions.js)

### Enforce Data Isolation and Ownership

**Use when**

Developing applications that manage multi-user or multi-tenant data, or require strict record-level access control.

**Secure rules**

**Rule 1: Scope Prisma queries by the authenticated user's ownership identifier.**

Define ownership relationships in your Prisma schema and include the authenticated user's identifier in the `where` clause of every operation that must be owner-scoped. The filter limits the records affected or returned by that operation, but it does not authenticate the user or automatically protect queries where the filter is omitted; validate the identity and enforce authorization in application logic. Make critical ownership identifiers such as `authorId` non-nullable when every record must have an owner, which maintains that data-integrity invariant but does not itself enforce access control.

```typescript
model Post {
  id Int @id @default(autoincrement())
  authorId Int // Required ownership reference
  title String
  content String
}

// To fetch posts for a specific user:
const userId: number = authenticatedUser.id;
const userPosts = await prisma.post.findMany({
  where: {
    authorId: userId,
  },
});
```

**Rule 2: Isolate data models and access controls between different database environments or drivers using separate schema files.**

When working with distinct database environments (e.g., different cloud providers or adapters) or requiring separate access boundaries, use dedicated `schema.prisma` files for each. Generate the Prisma Client specifically for each schema to enforce isolation and prevent accidental data exposure across environments.

```bash
pnpm prisma generate --schema prisma/postgres/schema.prisma
pnpm prisma generate --schema prisma/mysql/schema.prisma
```


**Source files**

- [`README.md`](https://github.com/prisma/prisma/blob/7.8.0/README.md)
- [`sandbox/driver-adapters/README.md`](https://github.com/prisma/prisma/blob/7.8.0/sandbox/driver-adapters/README.md)
