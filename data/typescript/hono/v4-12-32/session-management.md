# Security cards

Repository: `https://github.com/honojs/hono#v4.12.32`
Category: session management

## session management

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
