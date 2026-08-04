# Security cards

Repository: `https://github.com/koajs/koa#v3.2.1`
Category: secret handling

## secret handling

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
