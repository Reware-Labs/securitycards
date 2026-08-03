# Security cards

Repository: `https://github.com/drizzle-team/drizzle-orm#0.45.2`

## Category: access control

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


## Category: api contract misuse

### Propagate TransactionRollbackError and handle unsupported driver transactions correctly

**Use when**

When writing transactional boundaries and executing multi-statement operations across various database drivers in Drizzle ORM.

**Secure rules**

**Rule 1: Avoid invoking transactions on drivers that do not support interactive transactions.**

Do not invoke db.transaction() when using the neon-http driver or the MySQL Proxy session driver, as these drivers throw explicit runtime errors. Use db.batch() or non-transactional query execution instead.

```typescript
await db.batch([
  db.insert(users).values({ name: 'Alice' }),
  db.insert(auditLogs).values({ event: 'USER_CREATED' }),
]);
```


## Category: boundary control

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


## Category: injection

### Parameterize Dynamic Queries and Expressions Using Template Tags

**Use when**

When building custom SQL queries, database clauses, or expressions where dynamic values or user input must be included securely.

**Secure rules**

**Rule 1: Always use Drizzle's `sql` template literal tag for custom SQL expressions and dynamic values instead of raw string concatenation.**

Dynamic variables passed inside template placeholders `${value}` are safely parameterized by the ORM instead of being interpolated into raw SQL strings. Avoid passing untrusted input or string interpolation to `sql.raw()` or `db.execute()`, which treat strings as raw unescaped SQL.

```typescript
import { sql } from 'drizzle-orm';

const userInput = 'John';

const users = await db
  .select({
    name: sql<string>`upper(${usersTable.name})`,
  })
  .from(usersTable)
  .where(sql`${usersTable.name} = ${userInput}`);
```


### Rely on Built-in Parameter Binding for Inserts and Session Operations

**Use when**

When populating insert values, calling database session methods, or passing arguments through proxy and driver integrations.

**Secure rules**

**Rule 1: Pass plain JavaScript literal values or dedicated parameter arrays to insert and session methods rather than concatenating strings.**

When populating insert values using `.values()`, pass standard JavaScript literal values directly so Drizzle ORM automatically wraps non-SQL object values into parameterized instances. When using low-level session query methods, supply dynamic inputs via designated parameter arrays rather than interpolating or concatenating string values directly into the query string.

```typescript
await db.insert(users).values({
  name: req.body.name,
  email: req.body.email
});
```


### Use `sql.identifier()` for Dynamic Table, Column, and Schema Names

**Use when**

When referencing dynamic table names, column names, or schema identifiers in custom queries or introspection operations.

**Secure rules**

**Rule 1: Validate untrusted identifier names against an allow-list before passing them to `sql.identifier()`**

`sql.identifier()` escapes the name but does not itself block injection—any attacker-supplied value must first be checked against a finite set of expected table/column names (or otherwise validated) and only then wrapped with `sql.identifier()`.

```typescript
import { sql } from 'drizzle-orm';

const ALLOWED_SORT_COLUMNS = ['id', 'created_at', 'name'] as const;

function safeIdentifier(name: string) {
  if (!ALLOWED_SORT_COLUMNS.includes(name as any)) {
    throw new Error('Invalid column name');
  }
  return sql.identifier(name);
}

// Usage in a request handler
const sortColumn = safeIdentifier(req.query.sortBy as string);

const rows = await db.execute(
  sql`select * from users order by ${sortColumn}`
);
```


## Category: input contract definition

### Validate Incoming Request Payloads and Schema Data Using Strict Schemas

**Use when**

When validating HTTP request payloads, CLI options, database schema snapshots, and serialized configuration inputs before processing application data.

**Secure rules**

**Rule 1: Validate request JSON with a Drizzle-generated Zod schema before executing queries**

Derive a Zod schema from your table definition using `createInsertSchema()` (or `createUpdateSchema()`/`createSelectSchema()` as appropriate). Parse the incoming JSON with that schema and use the parsed result in your Drizzle calls—never trust raw request bodies.

```typescript
import express from 'express';
import { pgTable, text, integer } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-orm/zod';

const users = pgTable('users', {
  id: integer().generatedAlwaysAsIdentity().primaryKey(),
  name: text().notNull(),
  age: integer().notNull(),
});

const userInsertSchema = createInsertSchema(users); // Zod validator

const app = express();
app.use(express.json());

app.post('/users', async (req, res) => {
  const data = userInsertSchema.parse(req.body); // validated JSON
  await db.insert(users).values(data);
  res.status(201).json({ id: data.id });
});
```

**Rule 2: Validate raw CLI options and configuration inputs using schema safe parsing.**

Always validate incoming input objects against strict schema contracts using safe parsing methods like `safeParse` before executing actions, and handle failures explicitly by exiting execution.

```typescript
const raw = flattenDatabaseCredentials(options);
const parsed = pushParams.safeParse(raw);
if (!parsed.success) {
  console.log('Please provide required params');
  process.exit(1);
}
const config = parsed.data;
```

**Rule 3: Enforce strict Zod schema validation when parsing PostgreSQL schema snapshots.**

Strictly validate incoming payloads against predefined Zod schema contracts using `.parse()` to prevent unexpected properties or malformed schema definitions from bypassing structural checks.

```typescript
import { pgSchema } from 'drizzle-kit/serializer/pgSchema';

function processSnapshotInput(rawSnapshot: unknown) {
  const validatedSchema = pgSchema.parse(rawSnapshot);
  return validatedSchema;
}
```


## Category: network boundary

### Protection for HTTP proxy drivers

**Use when**

When configuring custom HTTP proxy drivers to handle database queries over network boundaries.

**Secure rules**

**Rule 1: Keep `sql` and `params` separate when forwarding queries through an HTTP proxy**

Drizzle’s proxy drivers expect the raw SQL text and its placeholder-values array as distinct arguments. Forward them unchanged—do **not** interpolate parameters into the SQL string—so the server can bind values safely and prevent injection.

```typescript
import { drizzle } from 'drizzle-orm/pg-proxy';
import axios from 'axios';

const db = drizzle(async (sql, params, method) => {
  // Payload preserves separation
  const { data: rows } = await axios.post(
    'http://localhost:3000/query',
    { sql, params, method }
  );

  return { rows };
});
```


## Category: resource exhaustion

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


## Category: secret handling

### Secure database credentials and redact sensitive parameters in logs

**Use when**

Configuring database connections, CLI schemas, or logging options where secrets, tokens, and query parameters are exposed.

**Secure rules**

**Rule 1: Supply your database connection string through an environment variable**

Drizzle’s drivers accept a plain string URL, so keep secrets out of source control—store the URL in something like `DATABASE_URL` (loaded from a `.env` file or platform secret) and pass it at runtime.

```typescript
// .env   →  DATABASE_URL=postgres://user:pass@host:5432/app

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!, // pulled from env
});

export const db = drizzle({ client: pool });   // no secrets hard-coded
```

**Rule 2: Redact sensitive values in a custom `Logger` implementation**

`drizzle` lets you replace the default logger with your own class that implements `logQuery(query, params)`. Build on that hook to detect credentials, tokens, or other sensitive fields and mask them before the data is written anywhere.

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import type { Logger } from 'drizzle-orm/logger';

// simple helper — adapt to your threat model
function isSecret(value: unknown): boolean {
  return typeof value === 'string' && /password|token|secret/i.test(value);
}

class SecureLogger implements Logger {
  logQuery(query: string, params: unknown[]) {
    const safeParams = params.map((p) => (isSecret(p) ? '[REDACTED]' : p));
    console.log('Query:', query, '-- params:', safeParams);
  }
}

const db = drizzle(/* pg client */, { logger: new SecureLogger() });
```


## Category: security control integrity

### Propagate TransactionRollbackError to preserve database transaction integrity

**Use when**

When managing database transactions in SQLite with `db.transaction()` and handling errors inside transaction callbacks.

**Secure rules**

**Rule 1: Do not swallow TransactionRollbackError within custom try/catch blocks inside transaction callbacks.**

Ensure that `tx.rollback()` is permitted to propagate or that `TransactionRollbackError` is explicitly rethrown if caught inside a `try/catch` block. Swallowing this error prevents Drizzle's transaction runner from intercepting the rollback signal, risking partial mutations committing to the SQLite database and state inconsistency.

```typescript
await db.transaction(async (tx) => {
  await tx.insert(auditLogs).values({ action: 'permission_change' });

  try {
    await performSensitiveOperation();
  } catch (error) {
    // Allow TransactionRollbackError or intentional rollbacks to bubble up
    tx.rollback();
  }
});
```
