# Security cards

Repository: `https://github.com/koajs/koa#v3.2.1`

## Category: access control

### Enforce Authorization Checks and Store Claims within ctx.state in Koa

**Use when**

Enforcing access control, verifying user roles, and managing request-scoped permissions across Koa middleware and route handlers.

**Secure rules**

**Rule 1: Sign cookies that require tamper detection with long, random application keys**

Configure `app.keys` with long, random secret values before setting signed cookies. Use `{ signed: true }` for cookies whose integrity must be checked. Koa creates a corresponding signature cookie and uses it to detect tampering when the cookie is received. Multiple keys may be configured to support key rotation.

The values below are intentionally public dummy values. Replace them with independently generated secrets before deployment.

```javascript
const Koa = require('koa');

const app = new Koa();

app.keys = [
  'replace_with_a_long_random_secret_value_1',
  'replace_with_a_long_random_secret_value_2'
];

app.use(async ctx => {
  ctx.cookies.set('session', 'session_value', {
    signed: true
  });

  ctx.body = 'Session cookie set';
});

app.listen(3000);
```

**Rule 2: Use `ctx.assert()` to validate the presence of a user in `ctx.state` before executing restricted handlers**

Use `ctx.assert()` to check identity information stored in `ctx.state` (the recommended namespace for passing data through middleware) and reject unauthenticated requests with an appropriate HTTP status before protected logic executes.

```javascript
app.use(async (ctx, next) => {
  ctx.assert(ctx.state.user, 401, 'User not found. Please login!');
  await next();
});
```


## Category: api contract misuse

### Use the Updated Koa v3 ctx.throw Signature with Error Instances

**Use when**

When throwing HTTP errors using `ctx.throw()` in Koa v3 to ensure proper argument types and signatures are supplied.

**Secure rules**

**Rule 1: Pass an Error instance or explicit HTTP error as the second argument to `ctx.throw()` in Koa v3.**

In Koa v3, the underlying `http-errors` dependency update requires passing an `Error` instance or explicit HTTP error to `ctx.throw(status, error, properties)` instead of legacy string message parameters. Always construct an explicit `Error` instance to ensure proper error handling and serialization.

```js
const createError = require('http-errors');

app.use(async (ctx, next) => {
  if (!ctx.state.user) {
    const error = new Error('User not found');
    ctx.throw(404, error, { user: null });
  }
  await next();
});
```


## Category: authentication

### Secure authentication state and session handling in Koa

**Use when**

Implementing authentication middleware, protecting routes using context assertions, and issuing cryptographic session cookies.

**Secure rules**

**Rule 1: Store authentication context within request-scoped state**

Attach authenticated user records and authorization scopes inside upstream authentication middleware using `ctx.state`. Because Koa resets `ctx.state` to a fresh object for each incoming request context, attaching identity objects to `ctx.state` prevents cross-request data leaks.

```javascript
app.use(async (ctx, next) => {
  const user = await authenticateRequest(ctx.get('Authorization'));
  if (!user) {
    ctx.status = 401;
    return;
  }
  ctx.state.user = user;
  await next();
});
```

**Rule 2: Enforce authentication boundaries using context assertions**

Pass resolved user authentication data down the middleware chain via `ctx.state`, and enforce authentication boundaries using `ctx.assert(ctx.state.user, 401, ...)` to halt execution when an unauthenticated request reaches protected routes, ensuring standardized HTTP 401 status handling.

```javascript
app.use(async (ctx, next) => {
  ctx.assert(ctx.state.user, 401, 'Authentication required');
  await next();
});
```

**Rule 3: Configure secure and signed cookies for session tokens**

When issuing authentication tokens or session identifiers via `ctx.cookies.set()`, enable cryptographic signature validation with `signed: true` alongside security flags including `httpOnly: true`, `secure: true`, and explicit `sameSite` controls to prevent client-side tampering, session forgery, and XSS exposure.

```javascript
ctx.cookies.set('session', sessionToken, {
  signed: true,
  httpOnly: true,
  secure: true,
  sameSite: 'lax'
});
```


## Category: boundary control

### Enable asyncLocalStorage for Request Context Isolation

**Use when**

Configuring the Koa application instance to manage request-scoped data and error contexts safely across asynchronous execution boundaries.

**Secure rules**

**Rule 1: Enable asyncLocalStorage during application initialization to maintain safe request context isolation.**

Pass `{ asyncLocalStorage: true }` or a custom `AsyncLocalStorage` instance to the `Koa` application constructor. This ensures that ambient logging, tracing, or security context resolution via `app.currentContext` maintains safe context isolation across asynchronous execution boundaries and prevents leaking state between concurrent HTTP requests.

```javascript
const Koa = require('koa');

const app = new Koa({ asyncLocalStorage: true });

app.use(async (ctx, next) => {
  ctx.state.user = { id: '123' };
  await next();
});

app.on('error', (err) => {
  const currentCtx = app.currentContext;
  if (currentCtx) {
    console.error(`Error for user ${currentCtx.state.user?.id}:`, err.message);
  }
});
```


## Category: escape hatch

### Safely manage native response handling and security headers when bypassing Koa response

**Use when**

When implementing custom low-level streaming or response handling by setting `ctx.respond = false` to bypass Koa's built-in response pipeline.

**Secure rules**

**Rule 1: Manually finalize native response streams and set all required security headers before ending the response when `ctx.respond = false` is used.**

Setting `ctx.respond = false` bypasses Koa's automatic response handling and security middleware header applications. You must explicitly set required security headers and ensure the native `ctx.res` stream is properly ended to prevent hanging connections.

```javascript
app.use(async (ctx) => {
  ctx.respond = false;
  const res = ctx.res;
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end('Hello');
});
```


## Category: file handling

### Use `response.attachment()` for Safe File Downloads

**Use when**

Serving downloadable files and attachments to clients while preventing MIME-sniffing vulnerabilities.

**Secure rules**

**Rule 1: Call `ctx.attachment()` when returning file streams to enforce proper `Content-Disposition` headers.**

Use `ctx.response.attachment([filename])` or `ctx.attachment([filename])` when serving downloadable content to ensure correct `Content-Disposition` header formatting and prevent client browser MIME-sniffing vulnerabilities.

```javascript
app.use(async ctx => {
  ctx.attachment('report.pdf');
  ctx.body = fs.createReadStream('/path/to/report.pdf');
});
```


### Use ctx.attachment and set explicit Content-Type when serving static files

**Use when**

Serving static files or file attachments to users through Koa while ensuring secure Content-Disposition and MIME-type handling.

**Secure rules**

**Rule 1: Call ctx.attachment to configure safe Content-Disposition headers and prevent content-sniffing risks.**

When serving static files intended for download, call `ctx.attachment(filename)` to automatically handle `Content-Disposition` generation. To prevent browsers from executing potentially dangerous files inline, set an explicit `Content-Type` such as `application/octet-stream` before invoking `ctx.attachment()`.

```js
const fs = require('node:fs');

app.use(async (ctx) => {
  ctx.response.set('Content-Type', 'application/octet-stream');
  ctx.attachment('report.pdf');
  ctx.body = fs.createReadStream('/var/storage/report.pdf');
});
```


## Category: input contract definition

### Enforce Strict Request Content-Type Validation Before Body Processing

**Use when**

Validating incoming request content types against acceptable MIME types prior to parsing or processing payload data in Koa applications.

**Secure rules**

**Rule 1: Use `ctx.is()` or `ctx.request.is()` to validate incoming request content types and reject unsupported types before processing payload data.**

Check the incoming request MIME type using `ctx.is()` to ensure it matches the expected contract, such as `application/json`. If the content type does not match, reject the request by throwing an HTTP 415 Unsupported Media Type error.

```javascript
app.use(async (ctx, next) => {
  if (ctx.method === 'POST') {
    if (!ctx.is('application/json')) {
      ctx.throw(415, 'Unsupported Media Type: expected application/json');
    }
  }
  await next();
});
```


## Category: input driven boundary selection

### Validate Host Headers and Configure Subdomain Offsets Securely

**Use when**

Implementing hostname or subdomain-based request routing using `ctx.subdomains` or `ctx.hostname`.

**Secure rules**

**Rule 1: Configure subdomain offsets accurately and trust proxy headers only behind trusted reverse proxies.**

Set `app.subdomainOffset` explicitly to match your domain structure and enable `app.proxy` only when your server sits behind a trusted reverse proxy that securely strips or overwrites untrusted `X-Forwarded-Host` headers to prevent boundary spoofing.

```js
const Koa = require('koa');
const app = new Koa();

app.proxy = true;
app.subdomainOffset = 3;

app.use(async (ctx, next) => {
  const [tenant] = ctx.subdomains;
  if (!tenant || !isValidTenant(tenant)) {
    ctx.status = 404;
    return;
  }
  await routeToTenant(ctx, tenant);
});
```


## Category: input interpretation safety

### Adapt query parameter handling for URLSearchParams in Koa v3

**Use when**

When updating query parameter handling and validation logic during migration to Koa v3.x where URLSearchParams replaces legacy querystring parsing.

**Secure rules**

**Rule 1: Use explicit URLSearchParams query methods to retrieve and validate input parameters.**

Because Koa v3.x uses standard URLSearchParams for `ctx.querystring`, automatic bracket or object parsing for arrays and nested keys is not performed. Access query parameters using explicit methods like `.get()` and `.getAll()` to ensure input values are correctly retrieved for validation.

```javascript
app.use(async (ctx, next) => {
  const query = new URLSearchParams(ctx.querystring);
  const users = query.getAll('user');
  const item = query.get('items');
  await next();
});
```


## Category: network boundary

### Configure Trusted Reverse Proxy Settings in Koa

**Use when**

When deploying a Koa application behind a reverse proxy to manage network trust boundaries and inspect proxy headers safely.

**Secure rules**

**Rule 1: Only enable proxy header trust when deployed behind a trusted reverse proxy.**

Set `app.proxy = true` only when running behind a known reverse proxy that sanitizes or overrides incoming `X-Forwarded-*` headers. When enabled, configure `app.maxIpsCount` and `app.proxyIpHeader` to match your front-end proxy topology to prevent IP address spoofing and header injection.

```javascript
const Koa = require('koa');

const app = new Koa({
  proxy: true,
  maxIpsCount: 1,
  proxyIpHeader: 'X-Real-IP'
});
```


## Category: output encoding

### Use safe escaping and explicit types for responses to prevent injection

**Use when**

When rendering dynamic user input in Koa response bodies or redirect fallback messages to prevent HTML-context injection.

**Secure rules**

**Rule 1: Rely on built-in ctx.redirect HTML encoding and explicitly define response content types for raw string responses.**

When returning untrusted string content to `ctx.body`, explicitly set `ctx.type` before assignment to prevent Koa from automatically inferring an HTML content type for strings starting with `<`. Additionally, rely on `ctx.redirect` for HTML redirect fallbacks rather than constructing manual HTML bodies.

```javascript
app.use(async (ctx) => {
  const userInput = ctx.query.input;
  ctx.type = 'text/plain; charset=utf-8';
  ctx.body = userInput;
});
```


## Category: runtime environment hardening

### Configure Explicit Production Environment Mode

**Use when**

Instantiating the Koa application in a production deployment to prevent development mode behaviors.

**Secure rules**

**Rule 1: Explicitly set the environment mode during application instantiation to prevent exposing detailed error messages.**

Pass the `env` option explicitly or ensure `process.env.NODE_ENV` is set when instantiating `Koa`. If omitted, Koa defaults to development mode, which can leak sensitive stack traces and internal error information to clients during runtime failures.

```javascript
const Koa = require('koa');

const app = new Koa({
  env: process.env.NODE_ENV || 'production'
});
```


## Category: secret handling

### Load Cookie Signing Secrets Securely from Environment Variables

**Use when**

When configuring cookie signing keys and issuing signed cookies via `app.keys` in a Koa application.

**Secure rules**

**Rule 1: Load cryptographically random cookie signing secrets from environment configuration and assign an array of keys to app.keys to support secret rotation.**

Ensure that signing secrets are sufficiently long and never hardcoded as string literals in source code. Retrieve the secrets securely from environment variables and assign them as an array to `app.keys` to facilitate key rotation.

```javascript
const Koa = require('koa');
const app = new Koa();

// Load secure, random secrets from environment variables
app.keys = [
  process.env.COOKIE_SECRET_PRIMARY,
  process.env.COOKIE_SECRET_PREVIOUS
];

app.use(async ctx => {
  ctx.cookies.set('session', 'user-data', { signed: true });
});
```


## Category: security control integrity

### Maintain Middleware Control Flow by Explicitly Calling and Returning Next

**Use when**

Developing or modifying Koa middleware functions that handle request routing, authorization, or context-population.

**Secure rules**

**Rule 1: Ensure all non-terminal middleware explicitly calls and returns `next()` to maintain the middleware execution chain.**

Omitting `next()` prematurely halts the request processing pipeline, causing downstream security controls, validation checks, and route handlers to be skipped. Always invoke and return `next()` in non-terminal middleware to preserve security control integrity.

```javascript
app.use(async (ctx, next) => {
  if (ctx.query.id) {
    ctx.state.id = parseInt(ctx.query.id, 10);
  }
  return next();
});
```


## Category: session management

### Configure Secure, Signed Session Cookies and Proxy Trust in Koa

**Use when**

Configuring session identifiers, cookie attributes, and cryptographic keys using `ctx.cookies.set()` and `app.keys` in a Koa application.

**Secure rules**

**Rule 1: Set secure, signed, and restricted cookie attributes for session identifiers.**

When issuing session cookies via `ctx.cookies.set()`, explicitly configure `secure: true`, `sameSite: 'lax'` (or `'strict'`), `signed: true`, and `httpOnly: true` to prevent network interception, token tampering, and cross-site request vulnerabilities.

```js
ctx.cookies.set('sid', sessionToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  signed: true
});
```

**Rule 2: Configure strong cryptographic keys for signing session cookies.**

Assign sufficiently long and cryptographically random secret keys to `app.keys` to ensure proper signature verification and protect session cookies against client-side forgery.

```js
const Koa = require('koa');
const app = new Koa();

app.keys = [
  process.env.COOKIE_SECRET_PRIMARY,
  process.env.COOKIE_SECRET_SECONDARY
];

app.use(async ctx => {
  ctx.cookies.set('session_id', 'user_session_value', { signed: true });
});
```

**Rule 3: Enable proxy trust to correctly enforce secure session cookies behind a reverse proxy.**

Set `app.proxy = true` when running Koa behind a TLS-terminating reverse proxy so that Koa properly respects forwarded headers like `X-Forwarded-Proto` and applies the `Secure` flag to session cookies.

```js
const Koa = require('koa');
const app = new Koa();

app.proxy = true;
app.keys = [process.env.SESSION_SECRET];

app.use(ctx => {
  ctx.cookies.set('sid', 'session-id', { signed: true });
  ctx.status = 204;
});
```
