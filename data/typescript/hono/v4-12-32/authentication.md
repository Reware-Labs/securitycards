# Security cards

Repository: `https://github.com/honojs/hono#v4.12.32`
Category: authentication

## authentication

### Enforce HTTP Basic and Bearer Token Authentication with Timing-Safe Comparisons

**Use when**

Securing Hono endpoints with HTTP Basic Authentication or bearer tokens while preventing timing side-channels and unauthenticated access.

**Secure rules**

**Rule 1: Protect endpoints using basicAuth middleware with strict verification and context population**

Use Hono's `basicAuth` middleware on protected route prefixes to enforce HTTP Basic Authentication and short-circuit unauthenticated requests, injecting verified user state safely via the `onAuthSuccess` callback.

```typescript
type Env = { Variables: { user: string } }
const app = new Hono<Env>()

app.use(
  '/api/*',
  basicAuth({
    verifyUser: (u, p) => u === 'admin' && p === 'secure-pass',
    onAuthSuccess: (c, username) => {
      c.set('user', username)
    }
  })
)
```

**Rule 2: Authenticate requests using bearerAuth middleware with timing-safe validation**

When protecting routes with bearer tokens, pass explicit configuration options such as `token` or `verifyToken` to `bearerAuth` to ensure timing-safe evaluations against side-channel vulnerabilities.

```typescript
import { Hono } from 'hono'
import { bearerAuth } from 'hono/bearer-auth'

const app = new Hono()

app.use('/api/*', bearerAuth({
  token: process.env.API_BEARER_TOKEN,
  realm: 'api-access'
}))
```


### Secure Route Authentication Using Hono JWT and JWK Middleware

**Use when**

Protecting Hono API routes and microservices by enforcing JWT signature validation, algorithm restrictions, claim verification, and token extraction.

**Secure rules**

**Rule 1: Enforce explicit JWT signature algorithms and secrets using the jwt middleware**

When protecting routes with JSON Web Tokens, register the `jwt()` middleware prior to route handlers and explicitly specify both `options.secret` and `options.alg` to prevent algorithm confusion and authentication bypass.

```typescript
import { Hono } from 'hono'
import { jwt } from 'hono/jwt'

const app = new Hono()

app.use('/api/*', jwt({ secret: 'secure-secret', alg: 'HS256' }))

app.get('/api/profile', (c) => {
  const payload = c.get('jwtPayload')
  return c.json(payload)
})
```

**Rule 2: Configure JWK authentication middleware with valid key sources and strict algorithms**

When configuring JWK authentication, supply either a `keys` array or a `jwks_uri` along with allowed asymmetric algorithms in `alg` and standard claims validation under `verification` to prevent token replay and algorithm substitution.

```typescript
app.use('/api/*', jwk({
  jwks_uri: 'https://auth.example.com/.well-known/jwks.json',
  alg: ['RS256'],
  verification: {
    iss: 'https://auth.example.com/',
    aud: 'https://api.example.com'
  }
}))
```

**Rule 3: Verify JWTs before using their claims**

Use `verify()` before relying on a JWT payload for authenticated requests. It validates the configured algorithm, verifies the token signature, and checks `nbf`, `exp`, and `iat` claims by default. Configure `iss` and `aud` when those claims must match expected values. Do not use payloads returned by `decode()` or headers returned by `decodeHeader()` as verified identity data because those functions only parse the token.

```typescript
import { verify } from 'hono/jwt'

export async function verifyAccessToken(token: string, secretKey: string) {
  return await verify(token, secretKey, {
    alg: 'HS256',
    iss: 'https://auth.example.com',
    aud: 'my-api-service',
  })
}
```
