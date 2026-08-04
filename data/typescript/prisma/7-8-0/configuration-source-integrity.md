# Security cards

Repository: `https://github.com/prisma/prisma#7.8.0`
Category: configuration source integrity

## configuration source integrity

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
