# Security cards

Repository: `https://github.com/prisma/prisma#7.8.0`
Category: secret handling

## secret handling

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
