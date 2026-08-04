# Security cards

Repository: `https://github.com/trpc/trpc#v11.18.0`

## Category: access control

### Enforce Role and Membership Authorization Checks in tRPC Procedures

**Use when**

Developing tRPC procedures that require verification of organization membership, role assignment, or resource ownership before granting access.

**Secure rules**

**Rule 1: Validate organization membership or resource ownership within procedure middleware and throw a FORBIDDEN TRPCError on failure.**

Chain base procedures and middleware to verify authorization boundaries against validated inputs. If the membership check fails, throw a `TRPCError` with code `FORBIDDEN` to prevent unauthorized cross-tenant data access.

```typescript
export const organizationProcedure = authedProcedure
  .input(z.object({ organizationId: z.string() }))
  .use(function isMemberOfOrganization(opts) {
    const membership = opts.ctx.user.memberships.find(
      (m) => m.Organization.id === opts.input.organizationId,
    );
    if (!membership) {
      throw new TRPCError({
        code: 'FORBIDDEN',
      });
    }
    return opts.next({
      ctx: {
        Organization: membership.Organization,
      },
    });
  });
```


## Category: api contract misuse

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


## Category: authentication

### Extract and Verify Caller Credentials in tRPC Context Setup

**Use when**

Configuring context creation for incoming HTTP requests, WebSocket connections, or serverless adapters to ensure caller identity is cryptographically verified on every request.

**Secure rules**

**Rule 1: Extract and cryptographically verify authentication tokens or session credentials within the `createContext` helper for every request.**

Parse authorization headers or connection parameters within `createContext` and perform token validation before attaching the resulting user identity to the context object. Ensure unauthenticated requests resolve to an explicit null or unauthenticated user state rather than trusting raw payload inputs.

```typescript
export async function createContext({ req, res }: CreateHTTPContextOptions) {
  async function getUserFromHeader() {
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      return await decodeAndVerifyJwtToken(token);
    }
    return null;
  }
  const user = await getUserFromHeader();
  return { user };
}
```

**Rule 2: Authenticate WebSocket connections by validating connection parameters in the server context setup.**

Pass credentials via `connectionParams` on the client `createWSClient` call and inspect and validate those parameters inside `createContext` via `opts.info.connectionParams`.

```typescript
const wsClient = createWSClient({
  url: 'ws://localhost:3000',
  connectionParams: async () => {
    return { token: 'user-auth-token' };
  },
});

export const createContext = async (opts: CreateWSSContextFnOptions) => {
  const token = opts.info.connectionParams?.token;
  const user = await verifyAuthToken(token);
  return { user };
};
```


## Category: deserialization

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


## Category: file handling

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


## Category: input contract definition

### Define runtime input validation schemas for tRPC procedures

**Use when**

Building and securing tRPC queries, mutations, or subscription procedures that accept untrusted client inputs.

**Secure rules**

**Rule 1: Always specify explicit runtime input schemas using `.input()` with validation libraries like Zod.**

Use validation libraries such as Zod to define explicit input schemas on tRPC procedures via the `.input()` method. This ensures all untrusted client data is thoroughly parsed, validated, and rejected if malformed before reaching query, mutation, or subscription handlers.

```typescript
import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.create();

export const appRouter = t.router({
  getUser: t.procedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ input }) => {
      return { id: input.id };
    }),
});
```


## Category: input driven boundary selection

### Validate base path prefix and route handlers for tRPC endpoints

**Use when**

Configuring tRPC request handlers, standalone adapters, and HTTP method route exports to ensure proper path routing and request validation.

**Secure rules**

**Rule 1: Verify that incoming request URLs match the expected base path prefix before passing them to standalone tRPC handlers.**

When configuring a custom `basePath` in tRPC standalone handlers, explicitly check incoming requests against the defined prefix before delegating to the handler to prevent request misrouting.

```typescript
import { createServer } from 'http';
import { createHTTPHandler } from '@trpc/server/adapters/standalone';
import { appRouter } from './appRouter';

const handler = createHTTPHandler({
  router: appRouter,
  basePath: '/trpc/',
});

createServer((req, res) => {
  if (req.url?.startsWith('/trpc/')) {
    return handler(req, res);
  }
  res.statusCode = 404;
  res.end('Not Found');
}).listen(3001);
```

**Rule 2: Align fetchRequestHandler endpoint configuration with the actual route path and export both GET and POST HTTP methods.**

Ensure the `endpoint` path configuration option exactly matches the request path prefix where the route handler is mounted, and explicitly export both `GET` and `POST` request handlers from route entrypoints.

```typescript
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/routers/_app';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => ({}),
  });

export { handler as GET, handler as POST };
```


## Category: interface protocol hardening

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


## Category: network boundary

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


## Category: output encoding

### Use devalue parse and stringify for XSS mitigation

**Use when**

implementing a custom Devalue data transformer for serialization and deserialization

**Secure rules**

**Rule 1: Explicitly use devalue parse and stringify to prevent injection and XSS vulnerabilities**

When configuring a custom Devalue data transformer, explicitly wrap `parse` for deserialization and `stringify` for serialization to ensure built-in XSS mitigations are applied when processing rendered payloads.

```ts
import { parse, stringify } from 'devalue';

export const transformer = {
  deserialize: (object: any) => parse(object),
  serialize: (object: any) => stringify(object),
};
```


## Category: resource exhaustion

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


## Category: runtime environment hardening

### Disable Development Mode and Stack Traces in Production

**Use when**

initializing the tRPC server router and configuring runtime environment options for production deployment.

**Secure rules**

**Rule 1: Explicitly configure the `isDev` flag during router initialization to disable verbose error stack traces in production.**

Explicitly configure the `isDev` flag in `initTRPC.create()` or ensure runtime environment variables strictly match deployment settings so that tRPC does not expose stack traces (`error.data.stack`) in client error responses. Set `isDev` deterministically based on your deployment configuration during server router initialization.

```typescript
import { initTRPC } from '@trpc/server';

const t = initTRPC.create({
  isDev: process.env.NODE_ENV === 'development',
});
```


## Category: secret handling

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


## Category: security control integrity

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


## Category: session management

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
