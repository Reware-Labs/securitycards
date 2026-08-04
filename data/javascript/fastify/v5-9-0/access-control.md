# Security cards

Repository: `https://github.com/fastify/fastify#v5.9.0`
Category: access control

## access control

### Implement robust access control, routing constraints, and plugin encapsulation for Fastify routes

**Use when**

Developing and organizing route handlers, plugins, and custom request lifecycle hooks.

**Secure rules**

**Rule 1: Fail-fast authorization by gating protected routes within an `onRequest` hook.**

Use a scope-local hook to reject requests that lack necessary runtime keys or authentication tokens. Return a `503 Service Unavailable` status and include a `Retry-After` header to inform the client to attempt the request later.

```javascript
fastify.addHook('onRequest', function (request, reply, next) {
  if (!request.server.magicKey) {
    reply.statusCode = 503;
    reply.header('Retry-After', 5000);
    reply.send({ error: true });
    return;
  }
  next();
});
```

**Rule 2: Enforce strict route constraints for tenant or host separation.**

Explicitly define `constraints` on routes that require host-based or tenant-based filtering. Rejected requests will naturally return a `404 Not Found` rather than proceeding to unauthorized handlers.

```javascript
fastify.route({
  method: 'GET',
  url: '/secure',
  constraints: { host: 'trusted.example.com' },
  handler: (req, reply) => {
    reply.send({ data: 'secret' });
  }
});
```

**Rule 3: Require explicit opt-in for sensitive plugin behavior using route configuration.**

Utilize `routeOptions.config` to verify flags before applying potentially sensitive middleware or decorators within an `onRoute` hook. This prevents accidental application of plugins to unauthorized routes.

```javascript
instance.addHook('onRoute', (routeOptions) => {
  if (routeOptions.config?.useUtil === true) {
    // Safely attach plugin behavior here
  }
});
```

**Rule 4: Maintain strict plugin encapsulation to protect internal decorators.**

Keep authorization logic and helper decorators within the same encapsulation scope as the resources they protect. Avoid relying on global decorators to prevent accidental exposure of sensitive controls to unrelated plugins.

```javascript
fastify.register(async function privatePlugin (app) {
  app.decorate('requireAuth', async () => { /* auth logic */ });
  app.get('/private', async (req, reply) => {
    await app.requireAuth();
    return { success: true };
  });
});
```


**Source files**

- [`docs/Guides/Delay-Accepting-Requests.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Guides/Delay-Accepting-Requests.md)
- [`docs/Guides/Plugins-Guide.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Guides/Plugins-Guide.md)
