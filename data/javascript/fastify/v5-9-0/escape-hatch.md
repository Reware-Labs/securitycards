# Security cards

Repository: `https://github.com/fastify/fastify#v5.9.0`
Category: escape hatch

## escape hatch

### Restrict Use of Raw Response and Connection Hijack APIs

**Use when**

Developing Fastify route handlers or custom plugins that require low-level control over network responses or connection lifecycles.

**Secure rules**

**Rule 1: Avoid direct write operations via `reply.raw`**

Prefer Fastify's standard response APIs over the raw Node.js Response object (`reply.raw`). Using `reply.raw` to send a response skips Fastify's standard response logic, including serialization and automatic content-type handling. The `onResponse` hooks are still executed.

```javascript
fastify.get('/api/data', async (request, reply) => {
  reply.header('X-Response-Type', 'secure-json')
  return { secure: 'data' }
})
```

**Rule 2: Account for the lifecycle bypass caused by `reply.hijack()`**

Calling `reply.hijack()` before `reply.send()` halts the normal request lifecycle. It prevents Fastify from sending the response and from running the remaining hooks, and the application assumes full responsibility for the low-level request and response.

```javascript
fastify.get('/custom-stream', async (request, reply) => {
  reply.hijack()

  reply.raw.writeHead(200, {
    'Content-Type': 'text/plain',
    'Content-Security-Policy': "default-src 'self'"
  })
  reply.raw.write('safe payload')
  reply.raw.end()
})
```


**Source files**

- [`docs/Reference/Reply.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Reference/Reply.md)
