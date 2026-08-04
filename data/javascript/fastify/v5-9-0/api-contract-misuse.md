# Security cards

Repository: `https://github.com/fastify/fastify#v5.9.0`
Category: api contract misuse

## api contract misuse

### Respect Request-Scoped State and Lifecycle Contracts

**Use when**

When registering request-scoped properties or managing HTTP response lifecycles in Fastify applications.

**Secure rules**

**Rule 1: Do not decorate Request or Reply instances with mutable reference types.**

Avoid calling `fastify.decorateRequest()` or `fastify.decorateReply()` with direct reference types like Arrays or Objects. In Fastify v5, this is prohibited because references are shared across all incoming requests, which can lead to critical race conditions and cross-request data leaks. To safely maintain request-scoped state context, initialize the state dynamically inside a lifecycle hook like `onRequest`.

```javascript
fastify.addHook('onRequest', async (request, reply) => {
  request.state = { sessionActive: false };
});
```

**Rule 2: Do not manually modify the read-only reply.sent property.**

Treat the `reply.sent` property as a read-only getter. Manually setting `reply.sent = true` is strictly forbidden by Fastify and throws a runtime exception, disrupting the core application control flow. To correctly advance or alter the HTTP lifecycle, use framework-authorized methods such as `reply.send()` or `reply.hijack()`.

```javascript
fastify.get('/data', (req, reply) => {
  // Correct: Let sending a payload transition the lifecycle state
  reply.send({ data: 'example' });
});
```


**Source files**

- [`docs/Guides/Migration-Guide-V5.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Guides/Migration-Guide-V5.md)
- [`test/internals/reply.test.js`](https://github.com/fastify/fastify/blob/v5.9.0/test/internals/reply.test.js)
