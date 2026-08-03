# Security cards

Repository: `https://github.com/honojs/hono#v4.12.32`
Category: security control integrity

## security control integrity

### Configure Strict CORS and Timing Allowlist Policies

**Use when**

Configuring cross-origin resource sharing (`cors`) or server-timing (`timing`) middleware headers for untrusted origins.

**Secure rules**

**Rule 1: Validate and restrict cross-origin timing access by supplying an explicit origin allowlist instead of wildcarding with `crossOrigin: true`.**

When setting up the `timing` middleware, avoid setting `crossOrigin: true` without validation because it exposes a wildcard `Timing-Allow-Origin` header. Pass a context callback function `(c) => string | boolean` that dynamically checks the request `Origin` header against an approved origin list.

```typescript
import { Hono } from 'hono'
import { timing } from 'hono/timing'

const app = new Hono()

app.use(
  timing({
    crossOrigin: (c) => {
      const origin = c.req.header('Origin')
      const allowedOrigins = ['https://app.example.com']
      return origin && allowedOrigins.includes(origin) ? origin : false
    },
  })
)
```

**Rule 2: Explicitly specify allowed headers in CORS configuration to prevent automatic reflection of arbitrary preflight headers.**

When configuring the `cors` middleware, do not omit or leave `allowHeaders` empty, which causes Hono to automatically echo back any headers requested by the client. Explicitly configure `allowHeaders` with a specific list of permitted header names.

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

app.use('/api/*', cors({
  origin: 'https://app.example.com',
  allowHeaders: ['Content-Type', 'Authorization', 'X-Custom-Header'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
}))
```


### Configure and Secure Authentication and Authorization Middleware Pipelines

**Use when**

Developing routes that require authentication, token validation, basic authentication, remote JWKS verification, or request restriction using Hono middleware.

**Secure rules**

**Rule 1: Protect routes with `jwt()` middleware by specifying expected token locations and accessing verified payload context correctly via `c.get('jwtPayload')`.**

Properly specify the expected token transport location such as `headerName` or `cookie`. Be aware that configuring a custom `headerName` causes the middleware to ignore the standard `Authorization` header, preventing ambiguous header processing. Handlers downstream can retrieve verified payload context using `c.get('jwtPayload')`.

```typescript
import { Hono } from 'hono'
import { jwt } from 'hono/jwt'

const app = new Hono()

app.use('/auth/*', jwt({ secret: 'strong-secret-key', alg: 'HS256' }))

app.get('/auth/user', (c) => {
  const payload = c.get('jwtPayload')
  return c.json({ user: payload })
})
```

**Rule 2: Enforce strict algorithm restrictions when registering the `jwk()` middleware.**

Explicitly list allowed asymmetric algorithms in the `alg` configuration array (such as `['RS256']`). Never accept arbitrary algorithms or leave algorithm selection unconstrained to prevent algorithm substitution attacks.

```typescript
import { Hono } from 'hono'
import { jwk } from 'hono/jwk'

const app = new Hono()

app.use('/api/*', jwk({
  jwks_uri: 'https://auth.example.com/.well-known/jwks.json',
  alg: ['RS256']
}))
```

**Rule 3: Verify optional JWT payload when `allow_anon` is enabled in `jwk()` middleware.**

When configuring the JWK middleware with `allow_anon: true`, always verify `c.get('jwtPayload')` inside downstream route handlers before granting access to sensitive user resources, preventing unauthenticated access to restricted logic.

```typescript
import { Hono } from 'hono'
import { jwk } from 'hono/jwk'

const app = new Hono()

app.use('/resource/*', jwk({
  jwks_uri: 'https://auth.example.com/.well-known/jwks.json',
  alg: ['RS256'],
  allow_anon: true
}))

app.get('/resource/data', (c) => {
  const payload = c.get('jwtPayload')
  if (!payload) {
    return c.json({ access: 'anonymous' })
  }
  return c.json({ access: 'authenticated', user: payload.sub })
})
```

**Rule 4: Configure `bearerAuth` middleware to enforce token authentication and halt execution on missing tokens.**

Attach the middleware using `app.use()` prior to route handlers. Supply static valid tokens via the `token` parameter or provide dynamic validation via `verifyToken(token, c)`. The `bearerAuth` middleware validates authorization headers, halts execution on invalid or missing tokens, and prevents downstream route handlers from running.

```typescript
import { Hono } from 'hono'
import { bearerAuth } from 'hono/bearer-auth'

const app = new Hono()

app.use(
  '/api/*',
  bearerAuth({
    verifyToken: async (token, c) => {
      return token === 'secret-api-token'
    },
  })
)

app.get('/api/resource', (c) => c.json({ data: 'protected content' }))
```

**Rule 5: Configure basic authentication middleware with secure verification callbacks and timing-safe comparisons.**

Pass either static credential options or a custom `verifyUser` callback alongside `onAuthSuccess` to securely validate requests and set context state for downstream middleware handlers. Ensure the middleware properly executes `next()` on successful authorization and throws `HTTPException(401)` on failure, while utilizing `hashFunction` settings or built-in `timingSafeEqual` comparisons to protect against side-channel timing attacks.

```typescript
app.use('/admin/*', basicAuth({
  username: process.env.ADMIN_USER!,
  password: process.env.ADMIN_PASS!,
  hashFunction: (str) => crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
}))
```

**Rule 6: Configure `csrf()` middleware for Origin and Sec-Fetch-Site verification on non-safe methods.**

Mitigate Cross-Site Request Forgery by checking `Sec-Fetch-Site` and `Origin` headers on non-safe HTTP methods when form-like `Content-Type` headers are present. When configuring custom `origin` or `secFetchSite` options via strings, arrays, or dynamic function handlers, ensure allowed origins and fetch-site attributes are strictly constrained and validated, avoiding blanket approval of cross-site fetch sites.

```typescript
import { Hono } from 'hono'
import { csrf } from 'hono/csrf'

const app = new Hono()

app.use('/api/*', csrf({
  origin: (origin, c) => {
    const allowedOrigins = ['https://app.example.com', 'https://admin.example.com']
    return allowedOrigins.includes(origin)
  },
  secFetchSite: ['same-origin', 'same-site']
}))
```

**Rule 7: Enforce `bodyLimit` middleware to prevent request body size spoofing and resource exhaustion.**

Apply Hono's `bodyLimit` middleware to routes that accept request bodies rather than relying on HTTP request headers. The `bodyLimit` middleware inspects the actual payload streamed during request processing, ensuring oversized requests are rejected even if an attacker understates the `Content-Length` header.

```typescript
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'

const app = new Hono()

app.post(
  '/upload',
  bodyLimit({
    maxSize: 1024 * 1024,
    onError: (c) => c.text('Payload Too Large', 413),
  }),
  async (c) => {
    const body = await c.req.text()
    return c.json({ received: body.length })
  }
)
```

**Rule 8: Safely handle missing runtime cache globals in cache middleware.**

Configure the `onCacheNotAvailable` option when instantiating `cache` middleware to handle environments where the global `caches` object is unavailable, ensuring application monitoring accurately reflects cache control availability.

```typescript
import { Hono } from 'hono'
import { cache } from 'hono/cache'

const app = new Hono()

app.use(
  '/static/*',
  cache({
    cacheName: 'static-v1',
    onCacheNotAvailable: (c) => {
      console.warn('Cache API unavailable for request:', c.req.url)
    }
  })
)
```

**Rule 9: Ensure proper JWKS remote endpoint configuration for JWK middleware.**

When using `jwks_uri`, ensure the remote endpoint is reliably available and returns a valid JWKS object with a `keys` array to prevent unhandled 500 server errors during token verification.

```typescript
import { Hono } from 'hono'
import { jwk } from 'hono/jwk'

const app = new Hono()

app.use('/protected/*', jwk({
  jwks_uri: 'https://auth.example.com/.well-known/jwks.json',
  alg: ['RS256']
}))
```

**Rule 10: Register all routes and middleware on sub-apps before mounting them.**

When composing sub-applications using `app.route()`, Hono registers the middleware and route handlers defined on the sub-app up to that exact moment. Any middleware or route handlers attached after calling `app.route()` are omitted from the parent router.

```typescript
const subApp = new Hono()

subApp.use('*', authMiddleware)
subApp.get('/data', (c) => c.text('protected'))

const mainApp = new Hono()
mainApp.route('/api', subApp)
```

**Rule 11: Ensure middleware handlers await `next()` or return a response.**

When registering middleware handlers using `app.use()`, handlers must explicitly delegate execution to downstream handlers by calling `await next()` or finalize the request by returning a `Response` object to prevent unfinalized contexts and dispatch errors.

```typescript
import { Hono } from 'hono'

const app = new Hono()

app.use('/admin/*', async (c, next) => {
  if (!c.req.header('Authorization')) {
    return c.text('Unauthorized', 401)
  }
  await next()
})
```

**Rule 12: Safely integrate external framework handlers using `app.mount()` options.**

When mounting sub-applications or external framework handlers into the middleware pipeline using `app.mount()`, configure `optionHandler` and `replaceRequest` options explicitly when custom context or non-standard path matching is required to prevent unintended path boundary modifications.

```typescript
import { Hono } from 'hono'

const app = new Hono()

app.mount('/api/v1', externalHandler, {
  optionHandler: (c) => [c.env, c.executionCtx],
  replaceRequest: (req) => {
    return req
  }
})
```


### Enforce sequential multi-layered access controls with middleware combinators

**Use when**

Applying multiple authorization and verification checks across route handlers to ensure controls remain ordered, fail closed, and consistently applied.

**Secure rules**

**Rule 1: Use every() to enforce strict sequential execution of all security checks**

When multiple security controls must execute in a specific order and all must pass successfully, wrap them using `every()`. If any check in the sequence fails or throws an error, the chain halts immediately to fail closed and prevent unauthorized access.

```typescript
import { Hono } from 'hono'
import { every } from 'hono/combine'

const app = new Hono()

app.use('/admin/*', every(validateApiKey, checkAdminRole))
```

**Rule 2: Use some() only when alternative authentication fallback paths are intended**

When supporting alternative or fallback authentication mechanisms where any successful check grants access, wrap the handlers using `some()`. Be aware that `some()` short-circuits and skips remaining middleware as soon as the first handler succeeds.

```typescript
import { Hono } from 'hono'
import { some } from 'hono/combine'

const app = new Hono()

app.use('/dashboard/*', some(verifyOAuthToken, verifySessionCookie))
```
