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


### Encode untrusted data for the context the response places it in

**Use when**

Returning request-derived text or stored content in a response body, or writing request data into application logs.

**Secure rules**

**Rule 1: Escape untrusted values when the route composes an HTML body itself.**

`reply.send(object)` serializes JSON, which the browser does not execute. The exposure appears when a route builds markup instead: `reply.type('text/html')` with a concatenated string places untrusted values into an executable context, so stored `<script>` runs under your origin. Escape every interpolated value, or return structured data and let the client render it. Send `X-Content-Type-Options: nosniff` so the browser does not sniff the body into a richer type.

```javascript
const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);

fastify.get('/profiles/:id', async (request, reply) => {
  const profile = await loadProfile(request.params.id); // untrusted
  reply.header('X-Content-Type-Options', 'nosniff');
  return reply.type('text/html').send(`<h1>${escapeHtml(profile.name)}</h1>`);
});
```

**Rule 2: Strip newline and control characters before writing request data to a log.**

A value containing `\n` or `\r` splits one entry into two, letting a caller forge lines that appear to come from the server and push real events out of view. Replace line breaks and other control characters before logging, and cap the length so a single request cannot flood the log.

```javascript
const sanitizeForLog = (value, limit = 200) =>
  String(value).replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, limit);

fastify.post('/events', async (request, reply) => {
  request.log.info({ event: sanitizeForLog(request.body.message) }, 'client event');
  return { status: 'recorded' };
});
```

**Source files**

- [`docs/Reference/Reply.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Reference/Reply.md)
