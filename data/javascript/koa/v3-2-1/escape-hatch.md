# Security cards

Repository: `https://github.com/koajs/koa#v3.2.1`
Category: escape hatch

## escape hatch

### Safely manage native response handling and security headers when bypassing Koa response

**Use when**

When implementing custom low-level streaming or response handling by setting `ctx.respond = false` to bypass Koa's built-in response pipeline.

**Secure rules**

**Rule 1: Manually finalize native response streams and set all required security headers before ending the response when `ctx.respond = false` is used.**

Setting `ctx.respond = false` bypasses Koa's automatic response handling and security middleware header applications. You must explicitly set required security headers and ensure the native `ctx.res` stream is properly ended to prevent hanging connections.

```javascript
app.use(async (ctx) => {
  ctx.respond = false;
  const res = ctx.res;
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end('Hello');
});
```
