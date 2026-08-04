# Security cards

Repository: `https://github.com/drizzle-team/drizzle-orm#0.45.2`
Category: access control

## access control

### Enforce database-level access control and tenant isolation using row-level security and security view options

**Use when**

Developing database queries, defining table policies, or creating database views in multi-tenant or protected environments where unauthorized access across boundaries must be prevented.

**Secure rules**

**Rule 1: Enable row-level security and configure explicit access policies on tables**

Enable RLS using `.enableRLS()` and define policies using `pgPolicy()` with strict `using` and `withCheck` expressions or `crudPolicy()` bound to specific roles to prevent unauthorized cross-tenant data access.

```typescript
import { sql } from 'drizzle-orm';
import { integer, pgPolicy, pgRole, pgTable } from 'drizzle-orm/pg-core';

export const appRole = pgRole('app_user').existing();

export const users = pgTable('users', {
  id: integer('id').primaryKey(),
}, (table) => ({
  userPolicy: pgPolicy('tenant_isolation', {
    for: 'all',
    to: [appRole],
    using: sql`id = current_setting('app.current_user_id')::integer`,
    withCheck: sql`id = current_setting('app.current_user_id')::integer`,
  }),
})).enableRLS();
```

**Rule 2: Forward per-request authentication tokens to query execution**

Pass authentication tokens using `db.$withAuth(token)` or execute prepared query methods with the auth token parameter to ensure database row-level security and authorization policies execute under the correct user context.

```typescript
const userAuthToken = req.headers.authorization;

const userQuery = db.$withAuth(userAuthToken);
const users = await userQuery.select().from(usersTable);
```

**Rule 3: Configure security invoker and barrier options on database views**

Explicitly configure view security options using `.with({ securityInvoker: true, securityBarrier: true })` or `.sqlSecurity('invoker')` so that view queries execute with the calling user's permissions and prevent side-channel leaks.

```typescript
import { pgTable, integer, pgView } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: integer('id').primaryKey().notNull(),
});

export const secureUsersView = pgView('secure_users_view').with({
  securityInvoker: true,
  securityBarrier: true,
  checkOption: 'cascaded',
}).as((qb) => qb.select().from(users));
```
