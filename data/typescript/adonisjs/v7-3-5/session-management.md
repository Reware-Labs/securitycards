# Security cards

Repository: `https://github.com/adonisjs/core#v7.3.5`
Documentation repository: `https://github.com/adonisjs/v7-docs#main`
Category: session management

## session management

### Configure secure session cookie attributes

**Use when**

Configuring session cookie security options in AdonisJS applications

**Secure rules**

**Rule 1: Enable HttpOnly, secure transport, and SameSite policies on session cookies**

When configuring session settings in `config/session.ts`, ensure `cookie.httpOnly` is set to `true`, `cookie.secure` is enabled for HTTPS using `app.inProduction`, and `cookie.sameSite` is set to `'lax'` or `'strict'` to prevent XSS session theft and CSRF.

```typescript
export default defineConfig({
  enabled: true,
  cookieName: 'adonis-session',
  clearWithBrowser: false,
  age: '2h',
  cookie: {
    path: '/',
    httpOnly: true,
    secure: app.inProduction,
    sameSite: 'lax',
  },
  store: env.get('SESSION_DRIVER'),
})
```
