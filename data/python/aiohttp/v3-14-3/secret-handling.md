# Security cards

Repository: `https://github.com/aio-libs/aiohttp#v3.14.3`
Category: secret handling

## secret handling

### Load authentication credentials securely and avoid hardcoded secrets

**Use when**

Configuring client sessions, middleware, or requests requiring authentication credentials in `aiohttp` applications.

**Secure rules**

**Rule 1: Load user credentials dynamically from environment variables or a key vault instead of using hardcoded string literals.**

Retrieve sensitive credentials using `os.getenv` or a secret manager before initializing authentication middleware or client sessions to prevent leaking secrets in source control.

```python
import os
from aiohttp import ClientSession
from aiohttp.client_middleware_digest_auth import DigestAuthMiddleware

username = os.getenv("DIGEST_USER")
password = os.getenv("DIGEST_PASS")

digest_auth = DigestAuthMiddleware(login=username, password=password)
async with ClientSession(middlewares=(digest_auth,)) as session:
    pass
```

**Rule 2: Use encode_basic_auth to construct Authorization headers for Basic Authentication**

For HTTP Basic Authentication, build the Authorization header using encode_basic_auth and pass it via the headers parameter (the auth parameter and BasicAuth class are deprecated).

```python
from aiohttp import ClientSession, encode_basic_auth

headers = {"Authorization": encode_basic_auth("user", "pass")}
async with ClientSession(headers=headers) as session:
    async with session.get("https://example.com/api") as resp:
        data = await resp.json()
```

**Rule 3: Sanitize request and response headers before logging in custom middleware to prevent leaking secrets.**

Explicitly filter or redact sensitive header fields such as `Authorization`, `Cookie`, `Set-Cookie`, and custom API tokens from header dictionaries prior to passing them to logging frameworks.

```python
SENSITIVE_HEADERS = {"authorization", "cookie", "set-cookie", "x-api-key"}

def sanitize_headers(headers):
    return {
        k: ("[REDACTED]" if k.lower() in SENSITIVE_HEADERS else v)
        for k, v in headers.items()
    }

class SecureLoggingMiddleware:
    async def __call__(self, request, handler):
        _LOGGER.debug("[REQUEST HEADERS] %s", sanitize_headers(request.headers))
        response = await handler(request)
        _LOGGER.debug("[RESPONSE HEADERS] %s", sanitize_headers(response.headers))
        return response
```
