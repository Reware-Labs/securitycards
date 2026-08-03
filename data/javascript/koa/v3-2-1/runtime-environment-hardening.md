# Security cards

Repository: `https://github.com/koajs/koa#v3.2.1`
Category: runtime environment hardening

## runtime environment hardening

### Configure Explicit Production Environment Mode

**Use when**

Instantiating the Koa application in a production deployment to prevent development mode behaviors.

**Secure rules**

**Rule 1: Explicitly set the environment mode during application instantiation to prevent exposing detailed error messages.**

Pass the `env` option explicitly or ensure `process.env.NODE_ENV` is set when instantiating `Koa`. If omitted, Koa defaults to development mode, which can leak sensitive stack traces and internal error information to clients during runtime failures.

```javascript
const Koa = require('koa');

const app = new Koa({
  env: process.env.NODE_ENV || 'production'
});
```
