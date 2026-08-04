# Security cards

Repository: `https://github.com/honojs/hono#v4.12.32`

## Category: access control

### Enforce IP Restriction Rules and Deny Lists for Protected Routes

**Use when**

When restricting endpoint access by source IP addresses using allow lists and deny lists in Hono applications.

**Secure rules**

**Rule 1: Configure deny lists and allow lists explicitly using ipRestriction middleware to enforce fail-closed access control.**

The ipRestriction middleware evaluates denyList rules before allowList rules, denying access immediately if a match occurs. When an allowList is specified and non-empty, any IP address not explicitly matching the allowList is denied access by default. Ensure reliable connection retrieval functions are provided.

```typescript
app.use(
  '/admin/*',
  ipRestriction(
    getConnInfo,
    {
      denyList: ['10.0.0.0/8'],
      allowList: ['192.168.1.0/24', '127.0.0.1']
    },
    (remote, c) => c.text('Forbidden', 403)
  )
)
```


## Category: api contract misuse

### Implement Structured Error Handling and HTTPException Management

**Use when**

Building and configuring exception handlers, middleware stacks, and route logic to process runtime errors and authentication failures safely.

**Secure rules**

**Rule 1: Register a centralized `app.onError` handler to intercept uncaught exceptions and return sanitized error responses.**

Define centralized custom exception handling using `app.onError` and check whether errors are instances of `HTTPException`. Ensure that raw stack traces and internal system details are logged securely on the server and that only generic error payloads are returned to clients.

```typescript
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

const app = new Hono()

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse()
  }
  return c.json({ error: 'Internal Server Error' }, 500)
})
```

**Rule 2: Wrap JWT verification calls in try/catch blocks to handle specific validation failures securely.**

Use `try/catch` blocks around `JWT.verify` to intercept validation exceptions like `JwtTokenExpired` and `JwtTokenInvalid`, converting them into explicit HTTP 401 or 403 responses rather than letting unhandled rejections cause 500 server errors.

```typescript
import { JWT, JwtTokenExpired, JwtTokenInvalid } from 'hono/jwt'

try {
  const payload = await JWT.verify(token, secret, 'HS256')
  return c.json({ user: payload })
} catch (err) {
  if (err instanceof JwtTokenExpired || err instanceof JwtTokenInvalid) {
    return c.json({ error: 'Unauthorized: Invalid token' }, 401)
  }
  throw err
}
```

**Rule 3: Throw standard `Error` or `HTTPException` instances and sanitize error messages exposed via HTTP.**

Throw standard `Error` or `HTTPException` objects to ensure reliable error capture by Hono's middleware and error pipeline. Pass sensitive internal diagnostics via the `cause` option or external logging, while ensuring `message` properties carry safe, generic error messaging for external clients.

```typescript
import { HTTPException } from 'hono/http-exception'

try {
  await database.query()
} catch (err) {
  throw new HTTPException(500, {
    message: 'An internal error occurred. Please try again later.',
    cause: err
  })
}
```


### Use Hono Request Body Methods to Enable Request Cloning and Cache Reuse

**Use when**

Handling incoming HTTP request bodies in handlers, proxies, or middleware where request re-readability and cloning mechanisms are needed.

**Secure rules**

**Rule 1: Consume incoming request bodies using Hono's `HonoRequest` methods rather than reading `c.req.raw` body streams directly.**

When reading request bodies inside Hono applications, always use `c.req.json()`, `c.req.text()`, or `c.req.parseBody()` instead of interacting with `c.req.raw` directly. Hono's request methods populate `bodyCache` which is required for features like `cloneRawRequest` to function correctly. Bypassing these methods prevents body caching and results in an internal server error when cloning or re-reading the request stream.

```typescript
app.post('/forward', async (c) => {
  const payload = await c.req.json()
  const clonedReq = await cloneRawRequest(c.req)
  return fetch('https://backend.internal/api', clonedReq)
})
```


## Category: authentication

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


## Category: boundary control

### Isolate request state using Context set and get methods

**Use when**

Storing and retrieving per-request metadata and authentication state across Hono middleware boundaries.

**Secure rules**

**Rule 1: Store per-request metadata and authentication state strictly using `c.set()` and retrieve it via `c.get()` or `c.var` to keep request lifecycles strictly isolated.**

Use `c.set()` to attach request-scoped state during middleware execution and retrieve it via `c.get()` within route handlers. This prevents shared state from bleeding between concurrent requests and ensures proper isolation across asynchronous execution contexts.

```typescript
app.use('*', async (c, next) => {
  const user = await verifyAuthToken(c.req.header('Authorization'))
  c.set('user', user)
  await next()
})

app.get('/profile', (c) => {
  const user = c.get('user')
  return c.json({ userId: user.id })
})
```


## Category: configuration source integrity

### Import Hono from trusted registry sources

**Use when**

Importing Hono modules into Deno runtimes for application development.

**Secure rules**

**Rule 1: Import Hono from trusted, authenticated configuration and package registries such as JSR.**

When configuring Deno applications to use Hono, import the package from the official JSR registry (`jsr:@hono/hono`) to ensure the application receives verified maintenance releases, security updates, and context-isolation patches.

```typescript
import { Hono } from 'jsr:@hono/hono'

const app = new Hono()

app.get('/', (c) => c.text('Hello Deno!'))

export default app
```


## Category: cryptography

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


## Category: csrf

### Protect State-Changing Routes Against Cross-Site Request Forgery Using Hono CSRF Middleware

**Use when**

Building web applications or APIs with Hono where state-changing requests using ambient credentials require origin and request header validation.

**Secure rules**

**Rule 1: Apply Hono's `csrf()` middleware to validate request origins and browser request site contexts on state-changing HTTP methods.**

Use `hono/csrf` to protect non-GET and non-HEAD requests by evaluating `Origin` and `Sec-Fetch-Site` headers. Configure explicit allowed origins or custom validation callbacks to block unauthorized cross-site submissions.

```typescript
import { Hono } from 'hono'
import { csrf } from 'hono/csrf'

const app = new Hono()

app.use(
  '*',
  csrf({
    origin: ['https://example.com', 'https://app.example.com'],
  })
)
```


## Category: escape hatch

### Sanitize and isolate untrusted content used in dangerouslySetInnerHTML

**Use when**

Rendering dynamic or user-provided HTML content via `dangerouslySetInnerHTML` in Hono JSX components.

**Secure rules**

**Rule 1: Keep untrusted strings in escaped Hono interpolation instead of raw HTML APIs**

Hono escapes string values interpolated normally into an `html` tagged template. Raw HTML paths such as `raw()` and `dangerouslySetInnerHTML` bypass normal escaping, so do not pass request parameters or other untrusted strings through them. Keep such values as ordinary template interpolations.

```typescript
import { Hono } from 'hono'
import { html } from 'hono/html'

const app = new Hono()

app.get('/:username', (c) => {
  const { username } = c.req.param()
  return c.html(
    html`<!doctype html>
      <h1>Hello! ${username}!</h1>`
  )
})

export default app
```


## Category: file handling

### Prevent Path Traversal When Serving Static Files and Generating Static Sites

**Use when**

When configuring static file serving middleware or static site generation helpers to prevent unauthorized access and protect target output directories.

**Secure rules**

**Rule 1: Configure static file middleware using explicit root directories and manifests to prevent directory traversal.**

Ensure that `serveStatic` utilizes explicit root paths and includes the required manifest option when running on adapters like Cloudflare Workers to guarantee proper containment and file resolution.

```typescript
import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'
import manifest from '__STATIC_CONTENT_MANIFEST'

const app = new Hono()

app.use('/static/*', serveStatic({ root: './assets', manifest }))

export default app
```

**Rule 2: Validate static site generation routes and output destinations to prevent path traversal.**

Rely on built-in path validation mechanisms such as `toSSG`'s destination checks and sanitize any untrusted parameters used in route paths to ensure files remain bounded within expected target directories.

```typescript
import { Hono } from 'hono'
import { toSSG, ssgParams } from 'hono/ssg'
import fs from 'node:fs/promises'

const app = new Hono()
app.get('/posts/:id', ssgParams([{ id: 'first-post' }, { id: 'second-post' }]), (c) => {
  return c.html(`<h1>Post ${c.req.param('id')}</h1>`)
})

await toSSG(app, fs, { dir: './static' })
```


### Validate and constrain multipart form file uploads

**Use when**

Handling incoming file uploads and multipart/form-data payloads via `validator('form', ...)` or `parseBody()`.

**Secure rules**

**Rule 1: Limit multipart request bodies and verify uploaded file fields**

Apply Hono's `bodyLimit` middleware before the upload handler to reject request bodies larger than the configured `maxSize`. Parse multipart form data with `c.req.parseBody()` and verify that the expected upload field is a `File`. Before writing an uploaded file to storage or forwarding it to another service, validate that the expected fields exist and check metadata such as filename, MIME type, and size.

```ts
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'

const app = new Hono()

app.post(
  '/upload',
  bodyLimit({
    maxSize: 5 * 1024 * 1024, // 5 MiB
    onError: (c) => {
      return c.text('File too large', 413)
    },
  }),
  async (c) => {
    const body = await c.req.parseBody()
    const file = body['file']

    if (!(file instanceof File)) {
      return c.text('File is required', 400)
    }

    return c.text(`Uploaded ${file.name}`)
  }
)
```


## Category: input contract definition

### Validate input presence and content type when processing request bodies and parameters

**Use when**

Handling incoming JSON, form payloads, and localized language configurations where input validation and allowed structures must be strictly enforced.

**Secure rules**

**Rule 1: Validate required JSON fields in the validator callback before application logic**

Hono parses the `json` validation target only when the request has a matching JSON `Content-Type`. Otherwise, the validator callback receives an empty object. Check the required shape and fields in the callback, return a 400 response for invalid input, and return only validated data for the route handler to consume with `c.req.valid('json')`.

```typescript
import { Hono } from 'hono'
import { validator } from 'hono/validator'

const app = new Hono()

app.post(
  '/account',
  validator('json', (value, c) => {
    if (typeof value !== 'object' || value === null) {
      return c.text('Invalid!', 400)
    }

    const email = value.email

    if (typeof email !== 'string' || email.length === 0) {
      return c.text('Invalid!', 400)
    }

    return { email }
  }),
  (c) => {
    const { email } = c.req.valid('json')
    return c.json({ received: email })
  }
)

export default app
```

**Rule 2: Enforce strict whitelisting of permitted options when configuring language detection and fallback values.**

Ensure `fallbackLanguage` is explicitly included in `supportedLanguages`, and that `supportedLanguages` contains a strict whitelist of permitted language codes to prevent unvalidated inputs from entering application context.

```typescript
app.use(
  '*',
  languageDetector({
    supportedLanguages: ['en', 'fr', 'es'],
    fallbackLanguage: 'en',
  })
)
```


## Category: input driven boundary selection

### Configure static route paths and routing security controls upfront

**Use when**

Developing Hono applications that require secure routing boundaries, wildcard middleware paths, and sub-applications.

**Secure rules**

**Rule 1: Use route path introspection helpers and pattern constraints for route-level security controls.**

Inspect canonical route patterns using `routePath(c)` or `matchedRoutes(c)` from `hono/route` rather than raw paths, and apply explicit parameter regexes and strict path handling.

```typescript
import { Hono } from 'hono'
import { routePath } from 'hono/route'

const app = new Hono({ strict: true })

app.use('*', async (c, next) => {
  const pattern = routePath(c)
  if (pattern.startsWith('/admin') && !c.req.header('Authorization')) {
    return c.text('Unauthorized', 401)
  }
  await next()
})

app.get('/admin/:id{\d+}', (c) => c.text('Admin Section'))
```


## Category: input interpretation safety

### Safely handle route parameters and request headers in prototype-less dictionaries

**Use when**

Extracting request metadata, parameters, and query strings in Hono where input dictionaries use prototype-less objects.

**Secure rules**

**Rule 1: Access request parameters and headers using direct key lookup or indirect method invocation without relying on inherited prototype methods.**

Hono's `req.header()`, `req.query()`, and `req.param()` parse incoming request metadata into prototype-less objects created via `Object.create(null)`. Because these dictionaries do not inherit standard `Object.prototype` methods, developers must avoid calling built-in object methods directly on them and instead use indirect method invocation like `Object.prototype.hasOwnProperty.call()` or direct access via `c.req.param('key')`.

```typescript
app.get('/entry/:constructor', (c) => {
  const value = c.req.param('constructor')
  return c.text(`Entry: ${value}`)
})
```

**Rule 2: Configure explicit trailing slash canonicalization rules with path redirection behavior for wildcard routes.**

When canonicalizing request paths using `trimTrailingSlash` or `appendTrailingSlash`, set `alwaysRedirect: true` for wildcard routes so that redirection executes prior to route handling rather than relying on post-execution 404 status codes.

```typescript
import { Hono } from 'hono'
import { trimTrailingSlash, appendTrailingSlash } from 'hono/trailing-slash'

const app = new Hono()

app.use(trimTrailingSlash({ alwaysRedirect: true }))

app.use(appendTrailingSlash({
  alwaysRedirect: true,
  skip: (path) => /\.\w+$/.test(path)
}))
```


## Category: interface protocol hardening

### Configure Secure Headers Middleware and CSP Nonces

**Use when**

Enforcing HTTP response security headers, Content Security Policy directives, and secure nonce generation for inline scripts in Hono applications.

**Secure rules**

**Rule 1: Apply Hono's secureHeaders middleware to enforce critical HTTP security headers across application endpoints.**

Use `secureHeaders` from `hono/secure-headers` to configure explicit directive limits for Content Security Policy, Permissions Policy, Cross-Origin policies, and HSTS instead of relying solely on browser defaults.

```typescript
import { Hono } from 'hono'
import { secureHeaders, NONCE } from 'hono/secure-headers'

const app = new Hono()

app.use(
  '*',
  secureHeaders({
    strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
    xFrameOptions: 'DENY',
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", NONCE],
      objectSrc: ["'none'"]
    },
    permissionsPolicy: {
      camera: [],
      microphone: []
    }
  })
)
```

**Rule 2: Utilize the NONCE helper function within contentSecurityPolicy options to automatically generate cryptographically secure per-request nonces.**

Access the generated nonce in context using `c.get('secureHeadersNonce')` when rendering inline scripts or styles to prevent arbitrary inline script execution.

```typescript
import { Hono } from 'hono'
import { secureHeaders, NONCE } from 'hono/secure-headers'

const app = new Hono()

app.use('*', secureHeaders({
  contentSecurityPolicy: {
    scriptSrc: [NONCE, "'self'"],
    objectSrc: ["'none'"],
  },
}))

app.get('/', (c) => {
  const nonce = c.get('secureHeadersNonce')
  return c.html(`<script nonce="${nonce}">console.log('Secure script');</script>`)
})
```


### Validate Proxy Framing and Reject Malformed Header Formatting

**Use when**

When forwarding HTTP requests through proxy layers or handling platform request contexts where malformed headers or framing inconsistencies could cause request smuggling or protocol desynchronization.

**Secure rules**

**Rule 1: Enable strict connection processing in proxy configurations to strip hop-by-hop headers and reject invalid connection tokens.**

When forwarding requests using the proxy helper, set `strictConnectionProcessing: true` in the configuration options to ensure custom hop-by-hop headers declared in the `Connection` header are stripped and malformed formatting is rejected.

```typescript
app.get('/proxy/*', (c) =>
  proxy(`https://backend.internal/${c.req.param('*')}`, {
    ...c.req,
    strictConnectionProcessing: true,
  })
)
```


## Category: network boundary

### Use trusted connection info functions for IP address extraction

**Use when**

When configuring IP restriction middleware to control network reachability based on client addresses.

**Secure rules**

**Rule 1: Pass a trusted IP resolution function as the getIP argument to ipRestriction instead of relying on unvalidated request headers.**

When restricting IP access using the `ipRestriction` middleware, always supply a trusted connection info function such as `getConnInfo` from runtime adapters like `hono/cloudflare-workers` or `hono/node-server`. Do not use a callback that blindly reads headers like `X-Forwarded-For` unless operating behind a trusted reverse proxy that securely handles client IP forwarding.

```typescript
import { Hono } from 'hono'
import { ipRestriction } from 'hono/ip-restriction'
import { getConnInfo } from 'hono/cloudflare-workers'

const app = new Hono()
app.use('*', ipRestriction(getConnInfo, { allowList: ['203.0.113.5'] }))
```


## Category: output encoding

### Safely compose external class names using cx helper

**Use when**

When combining styled utility classes with dynamic or external class strings in Hono applications.

**Secure rules**

**Rule 1: Compose class attributes using Hono's cx() helper to encode attribute-breaking characters and sanitize CSS selectors.**

Pass dynamic user inputs through the `cx()` helper from `hono/css` to ensure proper HTML attribute escaping and CSS selector sanitization, preventing Cross-Site Scripting (XSS) and HTML element breakouts.

```typescript
import { css, cx, Style } from 'hono/css'

const baseButton = css`
  padding: 0.5rem 1rem;
`

export const CustomButton = ({ userClass }: { userClass?: string }) => {
  return (
    <>
      <Style />
      <button class={cx(baseButton, userClass)}>Click Me</button>
    </>
  )
}
```


## Category: resource exhaustion

### Enforce Body Size Limits to Prevent Excessive Memory Consumption

**Use when**

Handling incoming HTTP requests and processing request bodies in Hono applications, particularly when deployed on serverless environments like AWS Lambda.

**Secure rules**

**Rule 1: Apply the bodyLimit middleware to restrict payload size independently of client-supplied Content-Length headers.**

Use the `bodyLimit` middleware from `hono/body-limit` to enforce request size boundaries. This ensures payload restrictions are enforced directly against the actual payload body size, preventing attackers from bypassing limits with forged or understated `Content-Length` headers and mitigating denial-of-service risks caused by excessive memory usage.

```typescript
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { handle } from 'hono/aws-lambda'

const app = new Hono()

app.post(
  '/upload',
  bodyLimit({
    maxSize: 1024 * 1024,
    onError: (c) => c.text('Payload Too Large', 413)
  }),
  async (c) => {
    const body = await c.req.text()
    return c.json({ length: body.length })
  }
)

export const handler = handle(app)
```


## Category: secret handling

### Load application secrets securely from environment bindings or providers

**Use when**

When configuring authentication, environment variables, or platform secrets in Hono applications.

**Secure rules**

**Rule 1: Avoid hardcoding plaintext credentials and secrets in source code**

Do not include plaintext credentials or static secrets directly in source code or parameter definitions. Load them securely from environment variables using `env` from `hono/adapter`, or access secrets dynamically through the deployment platform.

```typescript
import { Hono } from 'hono'
import { env } from 'hono/adapter'
import { basicAuth } from 'hono/basic-auth'

type AuthEnv = {
  ADMIN_USER: string
  ADMIN_PASS: string
}

const app = new Hono()

app.use('/admin/*', (c, next) => {
  const { ADMIN_USER, ADMIN_PASS } = env<AuthEnv>(c)

  if (!ADMIN_USER || !ADMIN_PASS) {
    throw new Error('Admin credentials are not configured')
  }

  return basicAuth({
    username: ADMIN_USER,
    password: ADMIN_PASS,
  })(c, next)
})
```

**Rule 2: Access runtime environment bindings and secrets through request context env.**

Retrieve environment variables, platform secrets, and database bindings strictly via `c.env` on the request context rather than referencing global or module-scoped variables to prevent cross-request leakage.

```typescript
app.get('/secure-data', async (c) => {
  const secretKey = c.env.API_SECRET_KEY
  if (!secretKey) {
    return c.text('Configuration error', 500)
  }
  const data = await fetchExternalData(secretKey)
  return c.json(data)
})
```


## Category: security control integrity

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


## Category: session management

### Enforce secure cookie prefixes and validation for session tokens

**Use when**

Use when configuring cookie-based session identifiers or handling session-related tokens in Hono routes to prevent session tampering and domain injection.

**Secure rules**

**Rule 1: Use cookie prefixes to restrict session scope and enforce secure transmission.**

Use the cookie prefix option `host` in `setCookie`, `setSignedCookie`, `getCookie`, and `getSignedCookie` when managing sensitive session state to automatically enforce the `__Host-` prefix, secure flags, and path constraints.

```typescript
import { setCookie, getCookie } from 'hono/cookie'

app.post('/login', (c) => {
  setCookie(c, 'session_id', 'secret-session-token', {
    prefix: 'host',
    httpOnly: true,
    sameSite: 'Lax'
  })
  return c.text('Authenticated')
})
```
