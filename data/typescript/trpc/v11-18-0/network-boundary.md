# Security cards

Repository: `https://github.com/trpc/trpc#v11.18.0`
Category: network boundary

## network boundary

### Configure Explicit CORS Policies for tRPC Adapters

**Use when**

Configuring standalone or HTTP adapters for tRPC to handle cross-origin requests securely across network boundaries.

**Secure rules**

**Rule 1: Restrict Cross-Origin Resource Sharing (CORS) options by specifying trusted origins explicitly instead of using wildcards.**

Provide strict CORS configuration parameters when initializing adapters to prevent unauthorized cross-origin websites from making requests on behalf of users.

```typescript
import { createHTTPServer } from '@trpc/server/adapters/standalone';

createHTTPServer({
  router: appRouter,
  cors: {
    origin: 'https://app.example.com',
    credentials: true,
  },
});
```
