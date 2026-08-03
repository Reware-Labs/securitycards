# Security cards

Repository: `https://github.com/koajs/koa#v3.2.1`
Category: api contract misuse

## api contract misuse

### Use the Updated Koa v3 ctx.throw Signature with Error Instances

**Use when**

When throwing HTTP errors using `ctx.throw()` in Koa v3 to ensure proper argument types and signatures are supplied.

**Secure rules**

**Rule 1: Pass an Error instance or explicit HTTP error as the second argument to `ctx.throw()` in Koa v3.**

In Koa v3, the underlying `http-errors` dependency update requires passing an `Error` instance or explicit HTTP error to `ctx.throw(status, error, properties)` instead of legacy string message parameters. Always construct an explicit `Error` instance to ensure proper error handling and serialization.

```js
const createError = require('http-errors');

app.use(async (ctx, next) => {
  if (!ctx.state.user) {
    const error = new Error('User not found');
    ctx.throw(404, error, { user: null });
  }
  await next();
});
```
