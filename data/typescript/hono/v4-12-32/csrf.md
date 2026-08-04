# Security cards

Repository: `https://github.com/honojs/hono#v4.12.32`
Category: csrf

## csrf

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
