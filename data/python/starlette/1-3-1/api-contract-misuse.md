# Security cards

Repository: `https://github.com/Kludex/starlette#1.3.1`
Category: api contract misuse

## api contract misuse

### Cache the request body before consuming stream directly

**Use when**

When handling HTTP requests in Starlette and needing to read the request data as both a stream and a full body.

**Secure rules**

**Rule 1: Cache the request body in memory by calling request.body() before iterating over request.stream().**

Invoking `request.body()` or `request.json()` after consuming `request.stream()` will drain the unbuffered ASGI receive channel and cause subsequent `request.body()` calls to raise a `RuntimeError`. Always await `request.body()` first to cache the body payload in memory when both streaming and full body access are required.

```python
from starlette.requests import Request
from starlette.responses import JSONResponse

async def app(scope, receive, send):
    request = Request(scope, receive)
    body_bytes = await request.body()
    chunks = []
    async for chunk in request.stream():
        chunks.append(chunk)
    response = JSONResponse({"bytes": len(body_bytes)})
    await response(scope, receive, send)
```


### Secure Error Handling and Debug Configuration in Starlette

**Use when**

Configuring application error handling, exception handlers, and debug settings for Starlette applications in development and production environments.

**Secure rules**

**Rule 1: Configure custom exception handlers via the Starlette constructor to sanitize error responses.**

In Starlette 1.0 and later, register exception handlers by passing the `exception_handlers` dictionary parameter to the `Starlette` constructor rather than using legacy decorators. Ensure custom exception handlers omit raw exception details and internal error strings from response payloads.

```python
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import JSONResponse

async def custom_http_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse({"error": "Internal server error"}, status_code=500)

app = Starlette(
    routes=[],
    exception_handlers={500: custom_http_exception_handler}
)
```
