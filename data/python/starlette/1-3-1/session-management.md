# Security cards

Repository: `https://github.com/Kludex/starlette#1.3.1`
Category: session management

## session management

### Configure SessionMiddleware with Secure and HTTP-Only Flags

**Use when**

Configuring session state handling and cookie attributes for Starlette applications.

**Secure rules**

**Rule 1: Set the https_only flag to True on SessionMiddleware in production environments.**

Configure `SessionMiddleware` with `https_only=True` to ensure that session cookies are marked with the Secure flag and transmitted exclusively over encrypted HTTPS connections.

```python
import os
from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.middleware.sessions import SessionMiddleware

middleware = [
    Middleware(
        SessionMiddleware,
        secret_key=os.environ['SESSION_SECRET_KEY'],
        https_only=True,
        same_site='lax'
    )
]

app = Starlette(middleware=middleware)
```
