# Security cards

Repository: `https://github.com/adonisjs/core#v7.3.5`
Documentation repository: `https://github.com/adonisjs/v7-docs#main`
Category: interface protocol hardening

## interface protocol hardening

### Set security headers on served static files using header callbacks

**Use when**

Configuring the static file server to attach security-focused HTTP headers to protect against protocol confusion and MIME-sniffing vulnerabilities.

**Secure rules**

**Rule 1: Configure custom headers on static file responses to enforce protocol-level protections such as preventing MIME-sniffing and framing attacks.**

Use the `headers` configuration option in `config/static.ts` to inspect file paths and attach relevant HTTP security headers like `X-Content-Type-Options` and `X-Frame-Options` to responses.

```typescript
import { defineConfig } from '@adonisjs/static'

export default defineConfig({
  headers: (filePath) => {
    if (filePath.endsWith('.html')) {
      return {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      }
    }
  }
})
```
