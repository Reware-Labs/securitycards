# Security cards

Repository: `https://github.com/koajs/koa#v3.2.1`
Category: security control integrity

## security control integrity

### Maintain Middleware Control Flow by Explicitly Calling and Returning Next

**Use when**

Developing or modifying Koa middleware functions that handle request routing, authorization, or context-population.

**Secure rules**

**Rule 1: Ensure all non-terminal middleware explicitly calls and returns `next()` to maintain the middleware execution chain.**

Omitting `next()` prematurely halts the request processing pipeline, causing downstream security controls, validation checks, and route handlers to be skipped. Always invoke and return `next()` in non-terminal middleware to preserve security control integrity.

```javascript
app.use(async (ctx, next) => {
  if (ctx.query.id) {
    ctx.state.id = parseInt(ctx.query.id, 10);
  }
  return next();
});
```
