# Security cards

Repository: `https://github.com/koajs/koa#v3.2.1`
Category: authentication

## authentication

### Secure authentication state and session handling in Koa

**Use when**

Implementing authentication middleware, protecting routes using context assertions, and issuing cryptographic session cookies.

**Secure rules**

**Rule 1: Store authentication context within request-scoped state**

Attach authenticated user records and authorization scopes inside upstream authentication middleware using `ctx.state`. Because Koa resets `ctx.state` to a fresh object for each incoming request context, attaching identity objects to `ctx.state` prevents cross-request data leaks.

```javascript
app.use(async (ctx, next) => {
  const user = await authenticateRequest(ctx.get('Authorization'));
  if (!user) {
    ctx.status = 401;
    return;
  }
  ctx.state.user = user;
  await next();
});
```

**Rule 2: Enforce authentication boundaries using context assertions**

Pass resolved user authentication data down the middleware chain via `ctx.state`, and enforce authentication boundaries using `ctx.assert(ctx.state.user, 401, ...)` to halt execution when an unauthenticated request reaches protected routes, ensuring standardized HTTP 401 status handling.

```javascript
app.use(async (ctx, next) => {
  ctx.assert(ctx.state.user, 401, 'Authentication required');
  await next();
});
```

**Rule 3: Configure secure and signed cookies for session tokens**

When issuing authentication tokens or session identifiers via `ctx.cookies.set()`, enable cryptographic signature validation with `signed: true` alongside security flags including `httpOnly: true`, `secure: true`, and explicit `sameSite` controls to prevent client-side tampering, session forgery, and XSS exposure.

```javascript
ctx.cookies.set('session', sessionToken, {
  signed: true,
  httpOnly: true,
  secure: true,
  sameSite: 'lax'
});
```
