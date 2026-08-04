# Security cards

Repository: `https://github.com/koajs/koa#v3.2.1`
Category: access control

## access control

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
