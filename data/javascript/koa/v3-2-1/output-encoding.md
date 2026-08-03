# Security cards

Repository: `https://github.com/koajs/koa#v3.2.1`
Category: output encoding

## output encoding

### Use safe escaping and explicit types for responses to prevent injection

**Use when**

When rendering dynamic user input in Koa response bodies or redirect fallback messages to prevent HTML-context injection.

**Secure rules**

**Rule 1: Rely on built-in ctx.redirect HTML encoding and explicitly define response content types for raw string responses.**

When returning untrusted string content to `ctx.body`, explicitly set `ctx.type` before assignment to prevent Koa from automatically inferring an HTML content type for strings starting with `<`. Additionally, rely on `ctx.redirect` for HTML redirect fallbacks rather than constructing manual HTML bodies.

```javascript
app.use(async (ctx) => {
  const userInput = ctx.query.input;
  ctx.type = 'text/plain; charset=utf-8';
  ctx.body = userInput;
});
```
