# Security cards

Repository: `https://github.com/aio-libs/aiohttp#v3.14.3`
Category: network boundary

## network boundary

### Validate Proxy Headers and Configure Trusted Origins in Network Boundaries

**Use when**

Configuring request proxy settings, parsing proxy headers behind a reverse proxy, or managing cookie security origins in aiohttp.

**Secure rules**

**Rule 1: Validate reverse proxy headers against trusted proxy IPs before updating the request context.**

Do not rely on request proxy headers directly for security enforcement without validation. Verify that the request originates from a trusted proxy IP before updating scheme or host attributes.

```python
async def handler(request: web.Request) -> web.Response:
    if request.remote == "10.0.0.1":
        scheme = request.headers.get("X-Forwarded-Proto", request.scheme)
        host = request.headers.get("X-Forwarded-Host", request.host)
        request = request.clone(scheme=scheme, host=host)
    return web.Response(text=f"Host: {request.host}, Scheme: {request.scheme}")
```

**Rule 2: Avoid HTTPS Scheme in Environment Proxy Settings.**

Configure environment proxies using `http://` URL schemes rather than `https://` or `wss://` schemes. Environment proxy resolution in `aiohttp` silently ignores proxy URLs with https and wss schemes and falls back to unproxied connections.

```python
import os
import aiohttp

os.environ['HTTP_PROXY'] = 'http://proxy.example.com:8080'
os.environ['HTTPS_PROXY'] = 'http://proxy.example.com:8080'

async with aiohttp.ClientSession() as session:
    async with session.get('https://example.com') as resp:
        pass
```
