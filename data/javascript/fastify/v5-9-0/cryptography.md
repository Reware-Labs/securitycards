# Security cards

Repository: `https://github.com/fastify/fastify#v5.9.0`
Category: cryptography

## cryptography

### Secure Webhooks and Transport Layer Security Configuration

**Use when**

Configuring inbound webhook endpoints and establishing secure HTTPS transport for server instances.

**Secure rules**

**Rule 1: Preserve original raw request bodies for cryptographic signature verification.**

When webhooks require signature validation, calculate the HMAC or digest against the raw, unparsed request bytes. Use a custom content-type parser to capture the raw payload before it is transformed into a standard JSON object to ensure accurate signature matching.

```javascript
fastify.addContentTypeParser('application/json', {}, (req, payload, done) => {
  req.rawBody = payload.rawBody;
  done(null, payload.body);
});
```

Only applicable for Firebase Functions.

**Rule 2: Prefer reverse-proxy TLS termination in production and use Fastify's https option for direct TLS.**

Prefer terminating production TLS at a reverse proxy, as recommended by Fastify. When the application must terminate TLS directly, pass the Node.js HTTPS server options, including the key and certificate, through Fastify's `https` constructor option.

```javascript
const fastify = Fastify({
  https: {
    key: fs.readFileSync('/etc/ssl/private/server.key'),
    cert: fs.readFileSync('/etc/ssl/certs/server.crt')
  }
});
await fastify.listen({ port: 443 });
```


**Source files**

- [`docs/Guides/Serverless.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Guides/Serverless.md)
- [`test/https/https.test.js`](https://github.com/fastify/fastify/blob/v5.9.0/test/https/https.test.js)
