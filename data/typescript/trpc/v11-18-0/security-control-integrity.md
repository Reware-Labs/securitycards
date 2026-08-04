# Security cards

Repository: `https://github.com/trpc/trpc#v11.18.0`
Category: security control integrity

## security control integrity

### Ensure all splitLink branches include terminating links and security context

**Use when**

Configuring tRPC client links using `splitLink` to branch request execution based on operation context or conditions.

**Secure rules**

**Rule 1: Configure both true and false branches of a splitLink with terminating links**

When using `splitLink` to branch execution paths, both the `true` and `false` branches are required. `splitLink` creates an entirely new link chain for the selected branch, so each branch must use a terminating link (or end with one if multiple links are provided). Omitting a terminating link on a branch means operations on that path are not sent to the server.

```typescript
import {
  createTRPCClient,
  httpBatchLink,
  httpLink,
  splitLink,
} from '@trpc/client';
import type { AppRouter } from './server';

const url = `http://localhost:3000`;

const client = createTRPCClient<AppRouter>({
  links: [
    splitLink({
      condition(op) {
        // check for context property `skipBatch`
        return Boolean(op.context.skipBatch);
      },
      // when condition is true, use normal request
      true: httpLink({
        url,
      }),
      // when condition is false, use batching
      false: httpBatchLink({
        url,
      }),
    }),
  ],
});
```
