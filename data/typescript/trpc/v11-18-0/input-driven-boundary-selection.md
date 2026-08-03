# Security cards

Repository: `https://github.com/trpc/trpc#v11.18.0`
Category: input driven boundary selection

## input driven boundary selection

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
