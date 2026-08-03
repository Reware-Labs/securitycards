# Security cards

Repository: `https://github.com/fastify/fastify#v5.9.0`
Category: secret handling

## secret handling

### Protect Secrets and TLS Credentials from Exposure

**Use when**

When managing TLS key material, certificates, and runtime credentials in Fastify.

**Secure rules**

**Rule 1: Do not expect TLS keys or certificates in the Fastify initial configuration**

`fastify.initialConfig` is a frozen, read-only object. When HTTPS is initialized with `key`, `cert`, and `allowHTTP1: true`, `fastify.initialConfig.https` contains only `{ allowHTTP1: true }`; the key and certificate are removed.

```javascript
const { readFileSync } = require('node:fs');
const Fastify = require('fastify');

const fastify = Fastify({
  https: {
    allowHTTP1: true,
    key: readFileSync('./fastify.key'),
    cert: readFileSync('./fastify.cert')
  }
});

console.log(fastify.initialConfig.https);
```

**Rule 2: Do not treat decorator-based local authentication state as production-ready**

Fastify's delay-accepting-requests guide stores a provider-supplied `magicKey` in a decorator, but identifies that implementation as not production-ready and not horizontally scalable. Storing the `magicKey` elsewhere, such as in a cache database, is one possible improvement.


**Source files**

- [`docs/Guides/Delay-Accepting-Requests.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Guides/Delay-Accepting-Requests.md)
- [`test/internals/initial-config.test.js`](https://github.com/fastify/fastify/blob/v5.9.0/test/internals/initial-config.test.js)
