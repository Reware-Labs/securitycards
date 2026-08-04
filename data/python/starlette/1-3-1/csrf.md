# Security cards

Repository: `https://github.com/Kludex/starlette#1.3.1`
Category: csrf

## csrf

### Configure SameSite cookie attribute for SessionMiddleware to prevent cross-site request forgery

**Use when**

Configuring session handling in Starlette applications to protect state-changing requests from cross-site request forgery.

**Secure rules**

**Rule 1: Set the `same_site` parameter to `lax` or `strict` when instantiating `SessionMiddleware` to restrict automatic cookie inclusion on cross-site requests.**

When adding `SessionMiddleware` to your Starlette application middleware stack, explicitly set `same_site='lax'` or `same_site='strict'` along with `https_only=True`. This prevents browsers from sending session cookies on cross-site requests, mitigating Cross-Site Request Forgery (CSRF) vulnerabilities.

```python
from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.middleware.sessions import SessionMiddleware

middleware = [
    Middleware(SessionMiddleware, secret_key="change-me-in-production", same_site="lax", https_only=True)
]

app = Starlette(middleware=middleware)
```
