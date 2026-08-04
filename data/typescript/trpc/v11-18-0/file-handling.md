# Security cards

Repository: `https://github.com/trpc/trpc#v11.18.0`
Category: file handling

## file handling

### Secure File Upload Handling and Input Validation in tRPC Procedures

**Use when**

Developing tRPC procedures and client mutations that accept `FormData`, binary streams, or files.

**Secure rules**

**Rule 1: Use non-batched HTTP links and mutation procedures for FormData file uploads**

Configure tRPC client instances using `httpLink` instead of `httpBatchLink`, define server procedures handling files exclusively as mutations, and prevent global body parsers from intercepting multipart streams.

```typescript
import { createTRPCClient, httpLink } from '@trpc/client';
import type { AppRouter } from './server';

export const client = createTRPCClient<AppRouter>({
  links: [
    httpLink({
      url: '/api/trpc',
    }),
  ],
});
```

**Rule 2: Parse and validate binary and multipart file inputs explicitly**

Use `octetInputParser` for raw binary inputs and `z.instanceof(FormData)` or explicit checks to validate `FormData` and file attributes on the server.

```typescript
import { initTRPC } from '@trpc/server';
import { octetInputParser } from '@trpc/server/http';
import { z } from 'zod';

const t = initTRPC.create();

export const appRouter = t.router({
  uploadFile: t.procedure
    .input(octetInputParser)
    .mutation(async (opts) => {
      const stream: ReadableStream = opts.input;
      return { success: true };
    }),
});
```

**Rule 3: Prevent global body parsing middleware from intercepting tRPC upload endpoints**

Restrict generic body parsers like `express.json()` strictly to non-tRPC paths so request streams remain unconsumed for multipart handling.

```typescript
import express from 'express';
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter } from './router';

const app = express();
app.use('/api/legacy', express.json());
app.use('/trpc', trpcExpress.createExpressMiddleware({ router: appRouter }));
```
