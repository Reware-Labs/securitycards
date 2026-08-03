# Security cards

Repository: `https://github.com/honojs/hono#v4.12.32`
Category: interface protocol hardening

## interface protocol hardening

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
