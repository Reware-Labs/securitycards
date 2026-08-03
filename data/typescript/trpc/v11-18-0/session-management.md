# Security cards

Repository: `https://github.com/trpc/trpc#v11.18.0`
Category: session management

## session management

### Properly Handle Session Cookie Transmission and Header Propagation in tRPC Links

**Use when**

Configuring client links, Server-Side Rendering (SSR), or cross-domain subscriptions where session cookies must be correctly forwarded, sent across origins, or modified.

**Secure rules**

**Rule 1: Enable credentials for cross-domain SSE subscriptions**

When a web client and tRPC server are on different domains, configure `httpSubscriptionLink` with `withCredentials: true` through `eventSourceOptions`.

```tsx
import { httpSubscriptionLink } from '@trpc/client';

httpSubscriptionLink({
  url: 'https://example.com/api/trpc',
  eventSourceOptions() {
    return {
      withCredentials: true,
    };
  },
});
```

**Rule 2: Explicitly forward incoming request cookie headers during Server-Side Rendering (SSR).**

When pre-rendering pages using `createTRPCNext`, client cookies are not automatically attached to tRPC queries. Read `ctx.req.headers.cookie` and explicitly supply it in the `headers()` callback to maintain session context.

```ts
import { httpBatchLink } from '@trpc/client';
import { createTRPCNext } from '@trpc/next';
import type { AppRouter } from './api/trpc/[trpc]';

export const trpc = createTRPCNext<AppRouter>({
  ssr: true,
  config(info) {
    const { ctx } = info;
    if (typeof window !== 'undefined') {
      return {
        links: [httpBatchLink({ url: '/api/trpc' })],
      };
    }
    return {
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          headers() {
            if (!ctx?.req?.headers) {
              return {};
            }
            return {
              cookie: ctx.req.headers.cookie,
            };
          },
        }),
      ],
    };
  },
});
```

**Rule 3: Use `httpBatchLink` instead of `httpBatchStreamLink` when procedures need to set or modify session cookies.**

Streaming response chunks via `httpBatchStreamLink` prevents modification of HTTP response headers such as `Set-Cookie` after streaming begins. Use `httpBatchLink` for authentication, token renewal, or logout operations that issue cookies.

```ts
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './server';

const client = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000',
    }),
  ],
});
```


### Validate authentication sessions on the server side in tRPC context

**Use when**

Building and configuring tRPC server-side context to handle session validation.

**Secure rules**

**Rule 1: Perform session verification on the server side inside `createContext` using server-side session lookups or request cookie validation.**

Do not rely on client-side session state for authorizing tRPC procedure calls. Always retrieve and verify the session on the server side within `createContext` using session helpers such as `getServerSession` to prevent unauthorized users from bypassing authorization controls.

```typescript
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import { getServerSession } from 'next-auth';
import { authOptions } from '~/pages/api/auth/[...nextauth]';

export const createContext = async (opts: CreateNextContextOptions) => {
  const session = await getServerSession(opts.req, opts.res, authOptions);
  return {
    session,
  };
};
```
