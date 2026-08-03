# Security cards

Repository: `https://github.com/drizzle-team/drizzle-orm#0.45.2`
Category: secret handling

## secret handling

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
