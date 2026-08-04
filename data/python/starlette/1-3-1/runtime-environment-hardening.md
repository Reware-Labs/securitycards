# Security cards

Repository: `https://github.com/Kludex/starlette#1.3.1`
Category: runtime environment hardening

## runtime environment hardening

### Disable Debug Mode in Production Environments

**Use when**

Configuring production environments when instantiating `ServerErrorMiddleware` or configuring Starlette applications.

**Secure rules**

**Rule 1: Explicitly set `debug` to `False` in production environments.**

Ensure that `debug` is set to `False` when configuring `ServerErrorMiddleware` or initializing your Starlette application to prevent detailed error responses containing local variables and internal paths from being exposed to end users.

```python
import os
from starlette.applications import Starlette
from starlette.middleware.errors import ServerErrorMiddleware
from starlette.responses import PlainTextResponse

async def custom_500_handler(request, exc):
    return PlainTextResponse('Internal Server Error', status_code=500)

IS_DEBUG = os.getenv('DEBUG', 'False').lower() in ('true', '1')

app = ServerErrorMiddleware(app, handler=custom_500_handler, debug=IS_DEBUG)
```
