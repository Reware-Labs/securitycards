# Security cards

Repository: `https://github.com/sveltejs/kit#@sveltejs/kit@2.70.1`
Category: csrf

## csrf

### Configure Application Origin for SvelteKit CSRF Protection

**Use when**

Configuring deployment environment variables or reverse proxy headers for production builds to ensure SvelteKit correctly validates the origin of incoming state-changing requests.

**Secure rules**

**Rule 1: Define the explicit deployment origin using the `ORIGIN` environment variable so SvelteKit can accurately validate request headers against cross-site submissions.**

Set the `ORIGIN` environment variable to your full application URL when starting the production build. If deploying behind a trusted reverse proxy, you can alternatively configure `PROTOCOL_HEADER` and `HOST_HEADER` variables, provided the proxy securely sanitizes incoming client headers.

```sh
ORIGIN=https://my.site node build

# Or behind a trusted reverse proxy:
PROTOCOL_HEADER=x-forwarded-proto HOST_HEADER=x-forwarded-host node build
```
