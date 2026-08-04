# Security cards

Repository: `https://github.com/trpc/trpc#v11.18.0`
Category: api contract misuse

## api contract misuse

### Ensure tRPC client links end with a terminating link

**Use when**

Configuring the tRPC client links array for network dispatch and middleware execution.

**Secure rules**

**Rule 1: Always terminate the tRPC client links array with a valid terminating link such as `httpBatchLink`, `httpLink`, or `wsLink`.**

Configure your tRPC client by appending a terminating link at the end of the `links` array to ensure operations properly dispatch to the server rather than failing or bypassing operational safeties.

```ts
import { createTRPCClient, httpBatchLink, loggerLink } from '@trpc/client';
import type { AppRouter } from './server';

export const trpc = createTRPCClient<AppRouter>({
  links: [
    loggerLink(),
    httpBatchLink({
      url: 'https://api.example.com/trpc',
    }),
  ],
});
```


### Secure tRPC Error Handling and Information Leakage Prevention

**Use when**

Developing error handlers, custom error formatters, middleware exception management, and server configuration in tRPC v11.

**Secure rules**

**Rule 1: Throw explicit TRPCError instances with structured error codes instead of generic JavaScript errors.**

When authentication, validation, or resource checks fail within tRPC procedures or middlewares, throw a `TRPCError` with an appropriate code like `UNAUTHORIZED` or `NOT_FOUND` to ensure safe serialization and client-side communication.

```ts
import { TRPCError, initTRPC } from '@trpc/server';

const t = initTRPC.context<Context>().create();

export const protectedProcedure = t.procedure.use(async (opts) => {
  if (!opts.ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
  }
  return opts.next();
});
```

**Rule 2: Sanitize error messages and custom error shapes to prevent sensitive information disclosure.**

Avoid passing raw database errors or internal exception messages directly to clients. Attach detailed errors to the `cause` property or log them server-side, and ensure custom `errorFormatter` implementations only expose safe data.

```ts
import { initTRPC, TRPCError } from '@trpc/server';

const t = initTRPC.create();

export const appRouter = t.router({
  getSensitiveData: t.procedure.query(async () => {
    try {
      return await fetchDbData();
    } catch (err) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred. Please try again later.',
        cause: err,
      });
    }
  }),
});
```

**Rule 3: Disable stack traces in production environments.**

Ensure development stack traces are not leaked in client response payloads by explicitly configuring `isDev: false` or relying on `NODE_ENV === 'production'` when initializing tRPC.

```ts
import { initTRPC } from '@trpc/server';

const t = initTRPC.create({
  isDev: process.env.NODE_ENV === 'development',
});
```

**Rule 4: Map server caller errors using getHTTPStatusCodeFromError in custom endpoints.**

When invoking server-side callers outside standard network layers, catch errors, check if they are instances of `TRPCError`, and derive the correct HTTP status code using `getHTTPStatusCodeFromError` without exposing raw stacks.

```ts
import { TRPCError } from '@trpc/server';
import { getHTTPStatusCodeFromError } from '@trpc/server/http';

try {
  const postResult = await caller.post.byId({ id: postId });
  res.status(200).json({ data: { postTitle: postResult.title } });
} catch (cause) {
  if (cause instanceof TRPCError) {
    const httpStatusCode = getHTTPStatusCodeFromError(cause);
    res.status(httpStatusCode).json({ error: { message: cause.message } });
    return;
  }
  res.status(500).json({ error: { message: 'Internal server error' } });
}
```

**Rule 5: Configure explicit onError handlers for local links and direct callers.**

Provide `onError` handlers when utilizing `createCallerFactory`, router callers, or `unstable_localLink` options to guarantee that execution failures and procedure errors are properly captured and audited.

```ts
import { createTRPCClient, unstable_localLink } from '@trpc/client';
import type { AppRouter } from './server';
import { appRouter } from './server';

const client = createTRPCClient<AppRouter>({
  links: [
    unstable_localLink({
      router: appRouter,
      createContext: async () => ({}),
      onError: (opts) => {
        console.error(`Procedure error on path ${opts.path}:`, opts.error);
      },
    }),
  ],
});
```
