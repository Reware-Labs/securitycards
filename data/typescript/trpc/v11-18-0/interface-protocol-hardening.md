# Security cards

Repository: `https://github.com/trpc/trpc#v11.18.0`
Category: interface protocol hardening

## interface protocol hardening

### Configure Explicit CORS and Response Security Headers Across Adapters

**Use when**

Configuring transport adapters and handlers such as `createHTTPServer` or Next.js integrations where security headers and cross-origin policies are not applied automatically.

**Secure rules**

**Rule 1: Explicitly configure CORS middleware with restricted origins and methods on standalone servers.**

The tRPC Standalone Adapter (`createHTTPServer`) does not set default CORS headers or handle preflight OPTIONS requests. Wrap the handler or supply strict CORS middleware specifying explicitly allowed origins and methods rather than relying on default wildcard configurations.

```ts
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import cors from 'cors';
import { appRouter } from './appRouter';

createHTTPServer({
  middleware: cors({
    origin: 'https://app.example.com',
    methods: ['GET', 'POST'],
  }),
  router: appRouter,
  createContext() {
    return {};
  },
}).listen(3333);
```

**Rule 2: Set response headers dynamically using condition-aware response meta callbacks.**

When using the Next.js adapter or server-side rendering, configure HTTP response headers like caching controls dynamically inside `responseMeta`. Ensure error responses and sensitive data do not receive unintended caching rules.

```ts
import { createTRPCNext } from '@trpc/next';

export const trpc = createTRPCNext<AppRouter>({
  responseMeta(opts) {
    const { clientErrors } = opts;
    if (clientErrors.length) {
      return {
        status: clientErrors[0].data?.httpStatus ?? 500,
        headers: new Headers([
          ['cache-control', 'no-store, max-age=0'],
        ]),
      };
    }
    return {
      headers: new Headers([
        ['cache-control', 's-maxage=1, stale-while-revalidate=86400'],
      ]),
    };
  },
});
```


### Enforce standard Accept headers to avoid CORS preflight complications

**Use when**

Configuring client tRPC links for cross-origin requests.

**Secure rules**

**Rule 1: Configure standard Accept headers instead of custom headers when sending cross-origin streaming requests.**

Set `streamHeader: 'accept'` in `httpBatchStreamLink` options to utilize standard CORS-safelisted headers. This prevents unnecessary browser CORS preflight requests caused by custom headers like `trpc-accept`.

```typescript
import { createTRPCClient, httpBatchStreamLink } from '@trpc/client';
import type { AppRouter } from './server';

const client = createTRPCClient<AppRouter>({
  links: [
    httpBatchStreamLink({
      url: 'https://api.example.com/trpc',
      streamHeader: 'accept',
    }),
  ],
});
```
