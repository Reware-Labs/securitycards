# Security cards

Repository: `https://github.com/koajs/koa#v3.2.1`
Category: session management

## session management

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
