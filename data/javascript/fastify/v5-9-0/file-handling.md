# Security cards

Repository: `https://github.com/fastify/fastify#v5.9.0`
Category: file handling

## file handling

### Secure Static File Serving in Fastify

**Use when**

When manually serving static files or assets, defining custom static routes, or bypassing the standard response lifecycle using hijack.

**Secure rules**

**Rule 1: Prefer static or simple parametric routes on hot paths.**

Prefer static or simple parametric routes on hot paths. Fastify supports regular expression routes, but they are expensive; routes with many parameters can also hurt router performance.

**Rule 2: Streams have no default content type; buffers default to `application/octet-stream`.**

When `reply.send()` sends a stream without a `Content-Type` header, the header remains unset. When it sends a buffer without a `Content-Type` header, Fastify sets `Content-Type` to `application/octet-stream`. `reply.type(contentType)` sets the response content type and is a shortcut for setting the `Content-Type` header.

**Rule 3: Handle the response manually after calling `reply.hijack()`.**

Calling `reply.hijack()` prevents Fastify from sending the response automatically and from running the remaining hooks. The application takes full responsibility for the low-level request and response. If `reply.raw` sends the response, `onResponse` hooks still run.

```javascript
fastify.get('/', (request, reply) => {
  reply.hijack()
  reply.raw.writeHead(200, { 'Content-Type': 'text/plain' })
  reply.raw.end('hijacked response')
})
```


**Source files**

- [`docs/Reference/Reply.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Reference/Reply.md)
- [`docs/Reference/Routes.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Reference/Routes.md)
- [`test/skip-reply-send.test.js`](https://github.com/fastify/fastify/blob/v5.9.0/test/skip-reply-send.test.js)
