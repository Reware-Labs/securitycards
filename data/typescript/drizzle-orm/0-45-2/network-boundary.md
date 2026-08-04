# Security cards

Repository: `https://github.com/drizzle-team/drizzle-orm#0.45.2`
Category: network boundary

## network boundary

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
