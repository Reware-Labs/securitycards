# Security cards

Repository: `https://github.com/trpc/trpc#v11.18.0`
Category: secret handling

## secret handling

### Avoid Exposing Authentication Tokens in URL Query Parameters for Subscriptions

**Use when**

Configuring client links like `httpSubscriptionLink` or setting up Server-Sent Events subscriptions that require authentication.

**Secure rules**

**Rule 1: Never pass authentication tokens or credentials inside URL query parameters or `connectionParams` when configuring subscription links.**

Query parameters and connection parameters are serialized into the HTTP connection URL string, causing credentials to be recorded in server access logs, proxy logs, browser history, and referrer headers. Use header-based authentication via an event source ponyfill and `eventSourceOptions` or rely on HTTP-only cookies instead.

```typescript
import { createTRPCClient, httpSubscriptionLink, splitLink } from '@trpc/client';
import { EventSourcePolyfill } from 'event-source-polyfill';

const trpc = createTRPCClient<AppRouter>({
  links: [
    splitLink({
      condition: (op) => op.type === 'subscription',
      true: httpSubscriptionLink({
        url: 'https://example.com/api/trpc',
        EventSource: EventSourcePolyfill,
        eventSourceOptions: async () => {
          const token = await auth.getToken();
          return {
            headers: {
              authorization: `Bearer ${token}`,
            },
          };
        },
      }),
      false: httpBatchLink({ url: 'https://example.com/api/trpc' }),
    },
  ],
});
```
