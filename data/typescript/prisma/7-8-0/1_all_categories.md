# Security cards

Repository: `https://github.com/prisma/prisma#7.8.0`

## Category: access control

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

## Category: api contract misuse

### Use Transactional Client Instances Within Interactive Transactions

**Use when**

Executing database operations within Prisma's interactive transactions.

**Secure rules**

**Rule 1: Always use the transaction-specific client instance (tx) provided within the interactive transaction callback, rather than the global Prisma client instance.**

When using Prisma's interactive transactions with the `$transaction` method that accepts an async callback, ensure all database operations inside the callback are performed using the `tx` argument. Using the global `prisma` client instance instead of `tx` will cause operations to execute outside the transaction, potentially leading to race conditions, partial updates, and data integrity issues.

```typescript
await prisma.$transaction(async (tx) => {
  const user = await tx.user.findFirst();
  // Incorrect: await prisma.user.update(...)
  // Correct:
  await tx.user.update({ ... });
});
```


**Source files**

- [`sandbox/tracing/index.ts`](https://github.com/prisma/prisma/blob/7.8.0/sandbox/tracing/index.ts)

## Category: configuration source integrity

### Configure Prisma migrations with secure, environment-specific settings

**Use when**

Setting up Prisma migrations, managing database credentials, or configuring the migration environment.

**Secure rules**

**Rule 1: Isolate database connection strings for different environments using environment variables.**

Use a dedicated connection string for each database environment and provide it through an environment variable. Select the intended environment's variable when running Prisma commands, and avoid hardcoding connection strings in `prisma.config.ts`.

```text
# Configure this separately in each environment:
DATABASE_URL="postgres://user:pass@host/db"

# Then specify in prisma.config.ts:
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
```

**Rule 2: Explicitly define migration configuration in `prisma.config.ts`.**

Define the `migrations` path and `datasource.url` explicitly in your `prisma.config.ts` file so the migration directory and database connection source are clear and reviewable. Source the URL from an environment variable rather than hardcoding credentials, and verify the selected environment before running migration commands.

```typescript
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
```

**Rule 3: Manually load environment variables for migration tasks in Prisma 7.x.**

Since Prisma 7.x no longer automatically loads `.env` files, you must manually implement this, for example, by using a `dotenv` package. This ensures that migration commands have access to the necessary database credentials and secrets, preventing failures or fallbacks to insecure defaults.

```typescript
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  datasource: {
    url: env('DATABASE_URL'),
  },
})
```

**Rule 4: Use a branch-specific PlanetScale password for schema operations.**

When configuring PlanetScale for Prisma's driver-adapter workflow, create a new password for the intended database branch (e.g., 'main'), select the Prisma template, and store the generated connection URL in `JS_PLANETSCALE_DATABASE_URL`. Use that branch-specific connection URL when running the PlanetScale schema-push workflow.

```text
JS_PLANETSCALE_DATABASE_URL="mysql://USER:PASSWORD@HOST/DATABASE?sslaccept=strict"
# Use the credentials generated for the intended branch with the Prisma template.
```

**Rule 5: Re-generate the Prisma Client after schema changes to maintain runtime consistency.**

After applying any schema changes or migrations, regularly re-generate the Prisma Client. This ensures that your application's runtime queries align with the current database state, preventing potential bypasses of new schema-level security constraints or runtime errors due to structural mismatches.

```bash
npx prisma generate
```


**Source files**

- [`sandbox/driver-adapters/README.md`](https://github.com/prisma/prisma/blob/7.8.0/sandbox/driver-adapters/README.md)
- [`README.md`](https://github.com/prisma/prisma/blob/7.8.0/README.md)

### Securely configure Prisma database connections

**Use when**

Configuring database connections and driver adapters in Prisma version 7.8.0.

**Secure rules**

**Rule 1: Define the datasource connection URL in `prisma.config.ts`.**

Prisma 7.x supports defining the datasource connection URL in `prisma.config.ts`. Set `datasource.url` to a static value or load a required value from an environment variable with the `env` helper.

```typescript
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  datasource: {
    url: env('DATABASE_URL'),
  },
})
```

**Rule 2: Provide validated connection strings to mandatory driver adapters.**

Prisma 7.8.0 mandates the use of Driver Adapters for all database connections. When initializing an adapter, such as `PrismaPlanetScale`, explicitly pass the connection URL as an object property. Ensure this connection string is validated and sourced from a secure environment provider.

```typescript
const adapter = new PrismaPlanetScale({
  url: process.env.JS_PLANETSCALE_DATABASE_URL
})
```


**Source files**

- [`sandbox/studio/prisma.config.ts`](https://github.com/prisma/prisma/blob/7.8.0/sandbox/studio/prisma.config.ts)
- [`sandbox/d1/prisma.config.ts`](https://github.com/prisma/prisma/blob/7.8.0/sandbox/d1/prisma.config.ts)
- [`sandbox/driver-adapters/src/planetscale.ts`](https://github.com/prisma/prisma/blob/7.8.0/sandbox/driver-adapters/src/planetscale.ts)
- [`sandbox/tracing/prisma.config.ts`](https://github.com/prisma/prisma/blob/7.8.0/sandbox/tracing/prisma.config.ts)

## Category: cryptography

### Implement cryptographic operations using secure and available primitives

**Use when**

Using cryptographic functions like hashing or random number generation within your application, especially when leveraging Prisma's compatibility layers.

**Secure rules**

**Rule 1: Always await asynchronous cryptographic hash digests when using polyfilled modules.**

When Prisma polyfills Node.js crypto functions using the Web Crypto API, such as with `globalThis.crypto.subtle.digest`, ensure you always `await` the `digest()` method. This prevents race conditions and ensures data integrity by completing the hash calculation before proceeding.

```typescript
import { createHash } from 'crypto';

async function hashData(data: string): Promise<ArrayBuffer> {
  const hash = createHash('SHA-256');
  hash.update(new TextEncoder().encode(data));
  const result = await hash.digest();
  return result;
}
```

**Rule 2: Ensure the runtime environment provides the cryptographic APIs used by Prisma.**

Prisma's crypto compatibility code relies on `globalThis.crypto` for helpers such as `randomUUID` and `randomFillSync`. Some Prisma call sites check whether a helper is available before invoking it. Guard calls in the same way: invoke these helpers only when the corresponding crypto API is available, because an unavailable API can cause a runtime failure.


**Source files**

- [`helpers/compile/plugins/fill-plugin/fillers/crypto.ts`](https://github.com/prisma/prisma/blob/7.8.0/helpers/compile/plugins/fill-plugin/fillers/crypto.ts)

## Category: dangerous execution

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

## Category: injection

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

## Category: input interpretation safety

### Ensure Accurate Type Matching for Query Parameters

**Use when**

When manually constructing query plans or extensions in Prisma Client, especially when dealing with specialized data types.

**Secure rules**

**Rule 1: Validate that parameter types used in query plans precisely match their expected runtime types to prevent data corruption or misinterpretation.**

When building custom query logic or extensions, always confirm that the types of parameters, particularly for specialized types like `DateTime`, `Decimal`, `BigInt`, and JSON/JSONB, align with what the database driver and Prisma expect. Use Prisma's built-in type constructors to ensure correct serialization.

```typescript
import { Prisma } from '@prisma/client';

const decimalValue = new Prisma.Decimal('10.5');
const bigIntValue = BigInt('9007199254740991');

// Example usage within a Prisma client operation (conceptual)
// await prisma.myModel.findMany({
//   where: {
//     decimalField: decimalValue,
//     bigIntField: bigIntValue
//   }
// });
```


**Source files**

- [`docs/plans/benchmark-improvements/004-review-interpreter-benchmarks.md`](https://github.com/prisma/prisma/blob/7.8.0/docs/plans/benchmark-improvements/004-review-interpreter-benchmarks.md)

## Category: interface protocol hardening

### Instantiate Prisma Client with a Mandatory Driver Adapter

**Use when**

Initializing PrismaClient in Prisma version 7.8.0.

**Secure rules**

**Rule 1: Always provide a mandatory driver adapter when instantiating PrismaClient.**

In Prisma version 7.8.0 and later, the Prisma Client requires a driver adapter to manage database communication. Ensure you explicitly instantiate the `PrismaClient` with a compatible driver adapter to establish a secure and functioning connection to your database.

```typescript
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from './generated/prisma/client'

const adapter = new PrismaBetterSqlite3({ url: 'file:prisma/dev.db' })
const prisma = new PrismaClient({ adapter })

// For D1 specific adapter:
// import { PrismaD1 } from '@prisma/adapter-d1'
// const adapter = new PrismaD1(env.MY_DATABASE);
// const prisma = new PrismaClient({ adapter });
```


**Source files**

- [`sandbox/basic-sqlite/index.ts`](https://github.com/prisma/prisma/blob/7.8.0/sandbox/basic-sqlite/index.ts)
- [`sandbox/d1/src/index.ts`](https://github.com/prisma/prisma/blob/7.8.0/sandbox/d1/src/index.ts)

## Category: network boundary

### Restrict database connections to authorized endpoints

**Use when**

Configuring Prisma Client to connect to a database, especially when using HTTP-based adapters or custom network configurations.

**Secure rules**

**Rule 1: Configure the Neon HTTP adapter with its database connection string.**

When using `PrismaNeonHttp`, store the Neon database connection string in the `JS_NEON_DATABASE_URL` environment variable and pass it to the adapter constructor.

```typescript
const connectionString = `${process.env.JS_NEON_DATABASE_URL as string}`;
const adapter = new PrismaNeonHttp(connectionString, {
  arrayMode: false,
  fullResults: true,
});
```


**Source files**

- [`sandbox/driver-adapters/README.md`](https://github.com/prisma/prisma/blob/7.8.0/sandbox/driver-adapters/README.md)
- [`sandbox/driver-adapters/src/neon.http.ts`](https://github.com/prisma/prisma/blob/7.8.0/sandbox/driver-adapters/src/neon.http.ts)

## Category: resource exhaustion

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

## Category: runtime environment hardening

### Disable Unnecessary Node.js Modules for Security

**Use when**

When developing or deploying applications using Prisma, especially in production environments.

**Secure rules**

**Rule 1: Avoid relying on Node.js core modules ('http', 'https', 'tls', 'net', 'dns', 'child_process') in code bundled with Prisma's fill-plugin configuration, where those modules are intentionally shimmed.**

Prisma, in version 7.8.0, uses a fill-plugin during bundling that replaces these core Node.js modules with empty contents. Code built with this configuration should not require functionality from the shimmed modules. For Prisma database communication, use the supported database Driver Adapters.


**Source files**

- [`helpers/compile/plugins/fill-plugin/fillPlugin.ts`](https://github.com/prisma/prisma/blob/7.8.0/helpers/compile/plugins/fill-plugin/fillPlugin.ts)

## Category: secret handling

### Manage secrets using environment variables in Prisma

**Use when**

Configuring database connections or other sensitive settings in Prisma, especially after version 7.0.0.

**Secure rules**

**Rule 1: Load environment variables for Prisma configuration and database connections.**

In Prisma versions 7.x and later, environment variables are not automatically loaded. You must explicitly import and call a library like 'dotenv/config' at the beginning of your Prisma configuration file (e.g., `prisma.config.ts`) to ensure that all necessary secrets, such as `DATABASE_URL`, are available before they are used. Alternatively, use the `env()` helper function from `@prisma/config` to access environment variables, ensuring that sensitive values like database connection strings are never hardcoded directly in your Prisma schema or configuration files to prevent leakage.

```typescript
import 'dotenv/config'
import { defineConfig, env } from '@prisma/config'

export default defineConfig({
  datasource: {
    url: env('DATABASE_URL'),
  },
})
```

**Rule 2: Prisma's tracing example does not establish query-argument capture.**

Prisma's tracing example demonstrates tracing setup, but it does not establish that Prisma query arguments are captured in spans or prescribe redacting those arguments before a query. Do not treat the example as evidence for either behavior.


**Source files**

- [`sandbox/studio/prisma.config.ts`](https://github.com/prisma/prisma/blob/7.8.0/sandbox/studio/prisma.config.ts)
- [`sandbox/driver-adapters/README.md`](https://github.com/prisma/prisma/blob/7.8.0/sandbox/driver-adapters/README.md)
- [`sandbox/studio/README.md`](https://github.com/prisma/prisma/blob/7.8.0/sandbox/studio/README.md)
- [`sandbox/driver-adapters/prisma/mysql/prisma.config.ts`](https://github.com/prisma/prisma/blob/7.8.0/sandbox/driver-adapters/prisma/mysql/prisma.config.ts)
- [`sandbox/tracing/index.ts`](https://github.com/prisma/prisma/blob/7.8.0/sandbox/tracing/index.ts)

## Category: security control integrity

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
