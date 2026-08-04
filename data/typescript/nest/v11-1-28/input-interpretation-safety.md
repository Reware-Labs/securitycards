# Security cards

Repository: `https://github.com/nestjs/nest#v11.1.28`
Documentation repository: `https://github.com/nestjs/docs.nestjs.com#master`
Category: input interpretation safety

## input interpretation safety

### Prevent Route Decoupling Bypasses via Path Canonicalization

**Use when**

Configuring route-level security middleware and authorization policies in NestJS applications.

**Secure rules**

**Rule 1: Fastify middleware matching decodes percent-encoded paths**

The Fastify middie adapter decodes the request URL before matching middleware regular expressions to avoid bypassing middleware. An integration test registers POST middleware for `tests/included` and verifies that a request to `/tests/%69ncluded` executes the registered middleware.

```typescript
consumer
  .apply((_req, res) => res.end('test_included'))
  .forRoutes({ path: 'tests/included', method: RequestMethod.POST });
```


**Source files**

- [`integration/hello-world/e2e/middleware-fastify.spec.ts`](https://github.com/nestjs/nest/blob/v11.1.28/integration/hello-world/e2e/middleware-fastify.spec.ts)
