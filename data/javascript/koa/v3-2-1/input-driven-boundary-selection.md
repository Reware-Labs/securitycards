# Security cards

Repository: `https://github.com/koajs/koa#v3.2.1`
Category: input driven boundary selection

## input driven boundary selection

### Validate Host Headers and Configure Subdomain Offsets Securely

**Use when**

Implementing hostname or subdomain-based request routing using `ctx.subdomains` or `ctx.hostname`.

**Secure rules**

**Rule 1: Configure subdomain offsets accurately and trust proxy headers only behind trusted reverse proxies.**

Set `app.subdomainOffset` explicitly to match your domain structure and enable `app.proxy` only when your server sits behind a trusted reverse proxy that securely strips or overwrites untrusted `X-Forwarded-Host` headers to prevent boundary spoofing.

```js
const Koa = require('koa');
const app = new Koa();

app.proxy = true;
app.subdomainOffset = 3;

app.use(async (ctx, next) => {
  const [tenant] = ctx.subdomains;
  if (!tenant || !isValidTenant(tenant)) {
    ctx.status = 404;
    return;
  }
  await routeToTenant(ctx, tenant);
});
```
