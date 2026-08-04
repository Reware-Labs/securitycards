# Security cards

Repository: `https://github.com/Kludex/starlette#1.3.1`
Category: network boundary

## network boundary

### Configure trusted proxy headers and remote address validation securely

**Use when**

Configuring access controls, rate limits, or security middleware that depend on client IP addresses and network trust boundaries behind reverse proxies.

**Secure rules**

**Rule 1: Use proxy-aware middleware to determine client addresses behind a proxy**

`request.client` reads the client address supplied in the ASGI scope and does not itself process forwarding headers. When the application is served behind a proxy and requires the forwarded client address, use proxy-aware middleware such as Uvicorn’s `ProxyHeadersMiddleware`, which determines client information from `X-Forwarded-For` and `X-Forwarded-Proto`.
