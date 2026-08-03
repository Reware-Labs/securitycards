# Security cards

Repository: `https://github.com/aio-libs/aiohttp#v3.14.3`
Category: interface protocol hardening

## interface protocol hardening

### Include HTTP security challenge headers in unauthorized server responses

**Use when**

Developing aiohttp web handlers that return `401 Unauthorized` responses and need to enforce protocol security policies.

**Secure rules**

**Rule 1: Explicitly include appropriate HTTP security challenge response headers when returning unauthorized responses.**

When returning `401 Unauthorized` status responses from an aiohttp web handler, explicitly include appropriate HTTP security challenge response headers such as `WWW-Authenticate` using the `headers` dictionary parameter. Pass these security response headers in `web.Response` to ensure API gateways and clients properly interpret authentication requirements.

```python
from aiohttp import hdrs, web

async def handle_protected(request: web.Request) -> web.Response:
    auth_header = request.headers.get(hdrs.AUTHORIZATION, "")
    if not auth_header.startswith("Basic "):
        return web.Response(
            status=401,
            text="Unauthorized",
            headers={hdrs.WWW_AUTHENTICATE: 'Basic realm="test"'},
        )
    return web.json_response({"status": "success"})
```


### Validate HTTP methods and enforce strict protocol parsing

**Use when**

Developing or handling incoming HTTP client requests and routing handlers where protocol framing and request methods must be strictly checked.

**Secure rules**

**Rule 1: Validate HTTP method strings to ensure they contain only valid token characters.**

Ensure that any HTTP methods passed to client requests are valid token strings and handle potential `ValueError` exceptions raised by aiohttp when encountering non-token characters such as spaces, newlines, or control characters.

```python
try:
    async with session.request(method=user_provided_method, url=target_url) as resp:
        body = await resp.text()
except ValueError:
    pass
```

**Rule 2: Rely on built-in HTTP request parser strict validation to enforce specification compliance.**

Rely on standard web application server handlers provided by aiohttp rather than writing custom low-level stream parsers to strictly reject malformed HTTP headers, bare LF delimiters, line folding, control characters, and conflicting or duplicate headers.

```python
from aiohttp import web

async def handle(request):
    return web.Response(text="Safe Response")

app = web.Application()
app.add_routes([web.get("/", handle)])
web.run_app(app)
```
