# Security cards

Repository: `https://github.com/fastify/fastify#v5.9.0`
Category: configuration source integrity

## configuration source integrity

### Treat Fastify Initial Configuration as Immutable

**Use when**

When instantiating and configuring a Fastify application instance with security-sensitive properties.

**Secure rules**

**Rule 1: Configure instance-wide security options through supported Fastify APIs and do not mutate fastify.initialConfig.**

Pass instance-wide options such as `bodyLimit` and `trustProxy` to the Fastify constructor. Fastify exposes `fastify.initialConfig` as a frozen, read-only copy of the initial configuration, and attempting to modify it throws a `TypeError`; do not use it to reconfigure a running instance. Use a setting's documented scoped configuration API when one is available.

```javascript
const fastify = require('fastify')({
  bodyLimit: 1048576,
  trustProxy: true
});
```

Note: `bodyLimit` may be configured per route as well


**Source files**

- [`lib/initial-config-validation.js`](https://github.com/fastify/fastify/blob/v5.9.0/lib/initial-config-validation.js)
