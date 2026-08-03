# Security cards

Repository: `https://github.com/koajs/koa#v3.2.1`
Category: input contract definition

## input contract definition

### Enforce Strict Request Content-Type Validation Before Body Processing

**Use when**

Validating incoming request content types against acceptable MIME types prior to parsing or processing payload data in Koa applications.

**Secure rules**

**Rule 1: Use `ctx.is()` or `ctx.request.is()` to validate incoming request content types and reject unsupported types before processing payload data.**

Check the incoming request MIME type using `ctx.is()` to ensure it matches the expected contract, such as `application/json`. If the content type does not match, reject the request by throwing an HTTP 415 Unsupported Media Type error.

```javascript
app.use(async (ctx, next) => {
  if (ctx.method === 'POST') {
    if (!ctx.is('application/json')) {
      ctx.throw(415, 'Unsupported Media Type: expected application/json');
    }
  }
  await next();
});
```
