# Security cards

Repository: `https://github.com/fastify/fastify#v5.9.0`
Category: output encoding

## output encoding

### Encode dynamic inputs in headers and redirect targets

**Use when**

When setting dynamic response headers or executing redirects with untrusted parameters.

**Secure rules**

**Rule 1: Encode destination URLs passed to redirect functions**

Input URLs passed to `reply.redirect()` must be properly encoded using `encodeURI` or a similar module such as `encodeurl`. Invalid URLs result in a `500 TypeError` response.

```javascript
fastify.get('/redirect', (request, reply) => {
  reply.redirect(encodeURI('/?key=a’b'))
})
```

**Rule 2: Properly encode values passed to `reply.header()`**

Header values passed to `reply.header()` must be properly encoded using `encodeURI` or a similar module such as `encodeurl`. Invalid characters result in a handled `500 TypeError` response rather than crashing the server.

```javascript
const encodeurl = require('encodeurl')

fastify.get('/custom-header', (request, reply) => {
  const rawInput = request.query.customValue
  const safeInput = encodeurl(rawInput)
  reply.header('X-Custom-Data', safeInput)
  reply.send({ status: 'success' })
})
```


**Source files**

- [`docs/Reference/Reply.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Reference/Reply.md)
