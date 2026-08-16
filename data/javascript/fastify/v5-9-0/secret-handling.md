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


### Protect secrets a caller entrusts to the service

**Use when**

An endpoint accepts a secret from a caller, stores it, and returns it on a later request.

**Secure rules**

**Rule 1: Resolve an encryption key once at startup and never mint one per request.**

A key created inside a handler is different on every call, so anything encrypted on one request cannot be decrypted on the next and the stored data is silently lost. Read the configured key once as the process starts. Where no dedicated key is configured, derive one deterministically from an existing application secret rather than generating a random one, so restarts stay readable.

```javascript
const crypto = require('node:crypto');

// Resolved once, at startup -- never inside a request handler.
const SECRET_KEY = process.env.SECRET_KEY
  ? Buffer.from(process.env.SECRET_KEY, 'base64')
  : crypto.createHash('sha256').update(process.env.APP_SECRET ?? '').digest();
```

**Rule 2: Keep stored secrets out of logs, error bodies, and collection responses.**

A secret returned by a list endpoint, echoed in a validation error, or written to a log line reaches every reader of that output, not just its owner. Return the value only on the endpoint documented to return it, and log an identifier instead of the secret itself.

```javascript
fastify.get('/secrets', async (request) => {
  const rows = await listSecretsFor(request.user.id);
  // The listing carries identifiers only; the value has its own endpoint.
  return rows.map(({ id, name, updatedAt }) => ({ id, name, updatedAt }));
});
```

**Source files**

- [`docs/Guides/Delay-Accepting-Requests.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Guides/Delay-Accepting-Requests.md)
- [`test/internals/initial-config.test.js`](https://github.com/fastify/fastify/blob/v5.9.0/test/internals/initial-config.test.js)
