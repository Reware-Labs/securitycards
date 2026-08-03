# Security cards

Repository: `https://github.com/koajs/koa#v3.2.1`
Category: network boundary

## network boundary

### Configure Trusted Reverse Proxy Settings in Koa

**Use when**

When deploying a Koa application behind a reverse proxy to manage network trust boundaries and inspect proxy headers safely.

**Secure rules**

**Rule 1: Only enable proxy header trust when deployed behind a trusted reverse proxy.**

Set `app.proxy = true` only when running behind a known reverse proxy that sanitizes or overrides incoming `X-Forwarded-*` headers. When enabled, configure `app.maxIpsCount` and `app.proxyIpHeader` to match your front-end proxy topology to prevent IP address spoofing and header injection.

```javascript
const Koa = require('koa');

const app = new Koa({
  proxy: true,
  maxIpsCount: 1,
  proxyIpHeader: 'X-Real-IP'
});
```
