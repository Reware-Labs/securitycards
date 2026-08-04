# Security cards

Repository: `https://github.com/trpc/trpc#v11.18.0`
Category: deserialization

## deserialization

### Configure identical data transformers consistently across client and server

**Use when**

Configuring request serialization and deserialization across the tRPC API boundary between server procedures and client links.

**Secure rules**

**Rule 1: Ensure that identical data transformer configurations are defined and applied on both the server via `initTRPC.create` and the client via link options.**

Define a shared transformer instance, such as `superjson`, and supply it to both `initTRPC.create` on the server and `httpLink` or `wsLink` on the client to prevent serialization mismatches and improper object reconstruction.

```typescript
// shared/transformer.ts
import superjson from 'superjson';
export const transformer = superjson;

// server/routers/_app.ts
import { initTRPC } from '@trpc/server';
import { transformer } from '../shared/transformer';

export const t = initTRPC.create({ transformer });

// client/trpc.ts
import { createTRPCClient, httpLink } from '@trpc/client';
import { transformer } from '../shared/transformer';
import type { AppRouter } from '../server/routers/_app';

export const client = createTRPCClient<AppRouter>({
  links: [
    httpLink({
      url: 'http://localhost:3000',
      transformer,
    }),
  ],
});
```
