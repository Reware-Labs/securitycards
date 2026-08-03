# Security cards

Repository: `https://github.com/aio-libs/aiohttp#v3.14.3`
Category: runtime environment hardening

## runtime environment hardening

### Disable Debug Mode and Traceback Leakage in Production

**Use when**

Configuring aiohttp client sessions, event loops, and web servers for production deployment.

**Secure rules**

**Rule 1: Disable asyncio event loop debug mode in production to prevent connection source tracebacks from being logged.**

Explicitly set `loop.set_debug(False)` or ensure the event loop runs without debug mode to prevent `source_traceback` objects from attaching to unclosed connection and connector exception contexts.

```python
import asyncio
import aiohttp

async def main():
    loop = asyncio.get_running_loop()
    loop.set_debug(False)

    async with aiohttp.ClientSession() as session:
        async with session.get('https://example.com') as resp:
            return await resp.text()

asyncio.run(main())
```

**Rule 2: Return a generic response for unexpected server errors**

Use an application middleware to catch unexpected handler exceptions and return a fixed HTTP 500 response body. Re-raise `web.HTTPException` instances so that intentional aiohttp HTTP responses retain their original status and content.

```python
from aiohttp import web


@web.middleware
async def generic_error_middleware(
    request: web.Request,
    handler,
) -> web.StreamResponse:
    try:
        return await handler(request)
    except web.HTTPException:
        raise
    except Exception:
        return web.Response(
            status=500,
            text="Internal Server Error",
        )


async def handler(request: web.Request) -> web.Response:
    raise RuntimeError("Internal diagnostic information")


app = web.Application(middlewares=[generic_error_middleware])
app.router.add_get("/", handler)

web.run_app(app)
```

**Rule 3: Avoid passing deprecated debug arguments to web applications and configure explicit production log levels.**

Do not pass the deprecated `debug` argument to `aiohttp.web.Application()`. Instead, configure production log levels explicitly using `logging.basicConfig` to prevent default `DEBUG` levels and stderr leakage.

```python
import logging
from aiohttp import web

logging.basicConfig(level=logging.INFO)
app = web.Application()
web.run_app(app, port=5000)
```
