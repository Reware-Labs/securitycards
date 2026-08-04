# Security cards

Repository: `https://github.com/honojs/hono#v4.12.32`
Category: api contract misuse

## api contract misuse

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
