# Security cards

Repository: `https://github.com/trpc/trpc#v11.18.0`
Category: resource exhaustion

## resource exhaustion

### Configure Batch Limits and Connection Timeouts in tRPC Links and Handlers

**Use when**

Configuring tRPC client links and server WebSocket handlers to protect finite server resources against unbounded batching, zombie connections, and leaked subscription event listeners.

**Secure rules**

**Rule 1: Set explicit batch and URL length limits on tRPC client batch links.**

Configure maxURLLength or request limits on batch links such as `httpBatchLink` to prevent malicious clients from sending arbitrarily large numbers of aggregated procedure calls in a single request.

```typescript
import { httpBatchLink } from '@trpc/client';

const client = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'https://api.example.com/trpc',
      maxURLLength: 2083,
    }),
  ],
});
```

**Rule 2: Enable keepAlive heartbeats and monitor subscription abort signals.**

Enable keepAlive ping/pong options in `applyWSSHandler` to disconnect unresponsive sockets, and pass `opts.signal` to async event iterators within subscription procedures to ensure listeners are properly cleaned up upon client disconnection.

```typescript
const handler = applyWSSHandler({
  wss,
  router: appRouter,
  createContext,
  keepAlive: {
    enabled: true,
    pingMs: 30000,
    pongWaitMs: 5000,
  },
});

export const subRouter = router({
  onPostAdd: publicProcedure.subscription(async function* (opts) {
    for await (const [data] of on(ee, 'add', { signal: opts.signal })) {
      yield tracked(data.id, data);
    }
  }),
});
```
