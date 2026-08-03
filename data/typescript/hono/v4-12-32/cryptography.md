# Security cards

Repository: `https://github.com/honojs/hono#v4.12.32`
Category: cryptography

## cryptography

### Use Secure Cryptographic Primitives and Handle Crypto API Availability

**Use when**

When performing cryptographic operations, hashing, signature verification, or signing data using Hono utilities and Web Crypto APIs.

**Secure rules**

**Rule 1: Handle null return values from Subtle Crypto utilities gracefully.**

Always check for `null` when calling hashing functions like `sha256`, `sha1`, `md5`, or `createHash`, as the underlying Web Crypto API may be absent in certain runtimes.

```typescript
import { sha256 } from 'hono/utils/crypto'

const hash = await sha256(payload)
if (!hash) {
  throw new Error('Web Crypto API is not supported in this runtime environment')
}
```

**Rule 2: Provide public keys or extractable keys for JWT signature verification.**

When verifying asymmetric JWT signatures, provide public keys in SPKI PEM, JWK, or public CryptoKey format rather than private keys, ensuring keys have `extractable: true` if private keys must be processed.

```typescript
const publicKey = `-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----`
const isValid = await verifying(publicKey, 'RS256', signature, data)
```

**Rule 3: Verify HMAC signed cookie results to prevent tampered state.**

When reading signed cookies using `parseSigned`, check that the returned cookie value is not `false` to ensure the cryptographic signature is valid and untampered.

```typescript
import { parseSigned, serializeSigned } from 'hono/cookie'

const secret = 'super-secret-key-at-least-32-bytes'
const cookieHeader = 'session=user-123.signature...'
const cookies = await parseSigned(cookieHeader, secret)
if (cookies.session && cookies.session !== false) {
  const userId = cookies.session
} else {
  // Handle untrusted or tampered cookie
}
```

**Rule 4: Restrict allowed algorithms when using JWKS verification.**

Explicitly constrain `allowedAlgorithms` to approved asymmetric signature algorithms when using `verifyWithJwks()` to prevent algorithm confusion attacks.

```typescript
import { verifyWithJwks } from 'hono/jwt'

const payload = await verifyWithJwks(token, {
  jwks_uri: 'https://auth.example.com/.well-known/jwks.json',
  allowedAlgorithms: ['RS256', 'ES256'],
  verification: {
    iss: 'https://auth.example.com',
    aud: 'my-api-service'
  }
})
```

**Rule 5: Supply custom digest functions for ETag generation when compliance demands stronger hashing.**

Configure a custom `generateDigest` function using `crypto.subtle.digest` with a stronger hashing algorithm like SHA-256 in environments requiring strict compliance policies.

```typescript
import { Hono } from 'hono'
import { etag } from 'hono/etag'

const app = new Hono()

app.use('*', etag({
  generateDigest: (body) => crypto.subtle.digest('SHA-256', body)
}))
```
