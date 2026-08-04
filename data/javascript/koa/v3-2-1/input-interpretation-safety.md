# Security cards

Repository: `https://github.com/koajs/koa#v3.2.1`
Category: input interpretation safety

## input interpretation safety

### Adapt query parameter handling for URLSearchParams in Koa v3

**Use when**

When updating query parameter handling and validation logic during migration to Koa v3.x where URLSearchParams replaces legacy querystring parsing.

**Secure rules**

**Rule 1: Use explicit URLSearchParams query methods to retrieve and validate input parameters.**

Because Koa v3.x uses standard URLSearchParams for `ctx.querystring`, automatic bracket or object parsing for arrays and nested keys is not performed. Access query parameters using explicit methods like `.get()` and `.getAll()` to ensure input values are correctly retrieved for validation.

```javascript
app.use(async (ctx, next) => {
  const query = new URLSearchParams(ctx.querystring);
  const users = query.getAll('user');
  const item = query.get('items');
  await next();
});
```
