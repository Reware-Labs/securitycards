# Security cards

Repository: `https://github.com/aio-libs/aiohttp#v3.14.3`
Category: access control

## access control

### Perform Early Authorization Checks Using Custom Expect Handlers

**Use when**

Implementing access control and header validation before accepting request bodies or acknowledging Expect: 100-continue requests in `aiohttp.web` applications.

**Secure rules**

**Rule 1: Validate user authorization within a custom expect handler to reject unauthorized requests before reading payloads.**

Define a custom expect handler function that inspects the request headers for authorization details. Raise an exception such as `web.HTTPForbidden()` directly inside the handler to block unauthorized clients before they upload request body data.

```python
async def expect_handler(request: web.Request) -> web.Response | None:
    if "Authorization" not in request.headers:
        raise web.HTTPForbidden()
    if request.version == aiohttp.HttpVersion11:
        await request.writer.write(b"HTTP/1.1 100 Continue\r\n\r\n")
    return None

app = web.Application()
app.router.add_route("POST", "/protected", handler, expect_handler=expect_handler)
```
