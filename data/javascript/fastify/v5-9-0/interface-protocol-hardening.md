# Security cards

Repository: `https://github.com/fastify/fastify#v5.9.0`
Category: interface protocol hardening

## interface protocol hardening

### Harden HTTP Protocol Integrity and Request Trust

**Use when**

Configuring Fastify routing, response trailers, and trusted proxy settings to prevent HTTP request smuggling and protocol spoofing.

**Secure rules**

**Rule 1: Do not register invalid response trailer names with `reply.trailer()`**

Fastify throws an error when `reply.trailer()` is called with an invalid trailer name, including `set-cookie`, `authorization`, `transfer-encoding`, `content-length`, `host`, or `trailer`. Documented response trailer examples include `Server-Timing`, `ETag`, and `content-md5`.

```javascript
const { createHash } = require('node:crypto')

fastify.get('/checksum', (request, reply) => {
  reply.trailer('content-md5', (reply, payload, done) => {
    const hash = createHash('md5').update(payload).digest('hex')
    done(null, hash)
  })
  reply.send('someData')
})
```

**Rule 2: Configure `trustProxy` strictly to trusted reverse proxy IP addresses to prevent protocol spoofing**

Avoid enabling global proxy trust. Configure `trustProxy` to exclusively target trusted address spaces (such as the specific loopback address `127.0.0.1` or the explicit IP of an upstream proxy). Keeping this strictly configured prevents external attackers from injecting fake security protocol headers like `X-Forwarded-Proto`, which could fool the server into treating unencrypted requests as secure HTTPS contexts.

```javascript
const Fastify = require('fastify')

const fastify = Fastify({
  trustProxy: '127.0.0.1',
  https: {
    key: process.env.SSL_KEY,
    cert: process.env.SSL_CERT
  }
})

fastify.get('/status', (req, reply) => {
  reply.send({ safe: req.protocol === 'https' })
})
```


**Source files**

- [`test/reply-trailers.test.js`](https://github.com/fastify/fastify/blob/v5.9.0/test/reply-trailers.test.js)
- [`test/https/https.test.js`](https://github.com/fastify/fastify/blob/v5.9.0/test/https/https.test.js)
- [`docs/Guides/Recommendations.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Guides/Recommendations.md)
