# Security cards

Repository: `https://github.com/honojs/hono#v4.12.32`
Category: input interpretation safety

## input interpretation safety

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
