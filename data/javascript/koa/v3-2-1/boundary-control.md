# Security cards

Repository: `https://github.com/koajs/koa#v3.2.1`
Category: boundary control

## boundary control

### Enable asyncLocalStorage for Request Context Isolation

**Use when**

Configuring the Koa application instance to manage request-scoped data and error contexts safely across asynchronous execution boundaries.

**Secure rules**

**Rule 1: Enable asyncLocalStorage during application initialization to maintain safe request context isolation.**

Pass `{ asyncLocalStorage: true }` or a custom `AsyncLocalStorage` instance to the `Koa` application constructor. This ensures that ambient logging, tracing, or security context resolution via `app.currentContext` maintains safe context isolation across asynchronous execution boundaries and prevents leaking state between concurrent HTTP requests.

```javascript
const Koa = require('koa');

const app = new Koa({ asyncLocalStorage: true });

app.use(async (ctx, next) => {
  ctx.state.user = { id: '123' };
  await next();
});

app.on('error', (err) => {
  const currentCtx = app.currentContext;
  if (currentCtx) {
    console.error(`Error for user ${currentCtx.state.user?.id}:`, err.message);
  }
});
```
