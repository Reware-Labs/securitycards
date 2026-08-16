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


### Store credentials as verifier hashes

**Use when**

Persisting a user password, or comparing a submitted credential against a stored one.

**Secure rules**

**Rule 1: Hash passwords with a slow, salted algorithm and never persist the plaintext.**

`bcrypt` applies a per-password salt and a tunable cost factor, so a stolen table cannot be reversed with a precomputed lookup. Hash on registration, verify with `bcrypt.compare`, and never store, log, or return the original value. A fast digest such as SHA-256 is not a password hash: it is cheap enough to brute-force offline.

```javascript
const bcrypt = require('bcrypt');

fastify.post('/register', async (request, reply) => {
  const { email, password } = request.body;
  const passwordHash = await bcrypt.hash(password, 12);
  await createUser(email, passwordHash); // the plaintext is never persisted
  return reply.code(201).send({ email });
});

fastify.post('/login', async (request, reply) => {
  const user = await findUser(request.body.email);
  const valid = user && (await bcrypt.compare(request.body.password, user.passwordHash));
  if (!valid) {
    return reply.code(401).send({ error: 'invalid credentials' });
  }
  return { token: issueToken(user) };
});
```

**Source files**

- [`docs/Guides/Serverless.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Guides/Serverless.md)
- [`test/https/https.test.js`](https://github.com/fastify/fastify/blob/v5.9.0/test/https/https.test.js)
