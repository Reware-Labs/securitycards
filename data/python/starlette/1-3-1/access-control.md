# Security cards

Repository: `https://github.com/Kludex/starlette#1.3.1`
Category: access control

## access control

### Enforce Role and Scope Authorization Checks on Endpoints

**Use when**

When building HTTP endpoints or WebSocket handlers in Starlette that require permission checks, role checks, or authentication state enforcement.

**Secure rules**

**Rule 1: Enforce required authentication scopes on endpoints using the requires decorator alongside AuthenticationMiddleware.**

Apply the `@requires` decorator to endpoint functions while ensuring `AuthenticationMiddleware` is installed in the application middleware pipeline to verify user permissions and authorization scopes.

```python
from starlette.applications import Starlette
from starlette.authentication import requires
from starlette.middleware import Middleware
from starlette.middleware.authentication import AuthenticationMiddleware
from starlette.responses import PlainTextResponse
from starlette.routing import Route

@requires(['authenticated', 'admin'])
async def admin_dashboard(request):
    return PlainTextResponse('Admin Dashboard')

routes = [Route('/admin', endpoint=admin_dashboard)]
middleware = [Middleware(AuthenticationMiddleware, backend=YourAuthBackend())]
app = Starlette(routes=routes, middleware=middleware)
```

**Rule 2: Prevent endpoint enumeration by returning custom status codes on permission denial.**

Use `status_code=404` with the `@requires` decorator to hide privileged routes from unauthorized users and prevent URL enumeration.

```python
from starlette.authentication import requires
from starlette.responses import PlainTextResponse

@requires(['authenticated', 'admin'], status_code=404)
async def secret_admin_panel(request):
    return PlainTextResponse('Secret Panel')
```


### Secure CORS Middleware Configuration and Origin Restrictions

**Use when**

Configuring `CORSMiddleware` in Starlette applications to handle cross-origin requests securely.

**Secure rules**

**Rule 1: Restrict origin matching regex in CORSMiddleware**

When using `allow_origin_regex` in `CORSMiddleware`, avoid wildcards like `.*` or `.+` because they match URL special characters such as `/`, `@`, `#`, or `?`. Instead, use specific character classes like `[a-zA-Z0-9-]+` to strictly match permitted subdomains.

```python
from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware

middleware = [
    Middleware(
        CORSMiddleware,
        allow_origin_regex=r"https://[a-zA-Z0-9-]+\.example\.com"
    )
]
app = Starlette(middleware=middleware)
```

**Rule 2: Configure specific origins for credentialed CORS requests**

When configuring `CORSMiddleware` in Starlette, avoid blindly using wildcard origins (`allow_origins=['*']`) alongside `allow_credentials=True` unless dynamic reflection of origins for credentialed cross-origin requests is explicitly intended and safe. Prefer specifying explicit origin URLs or using a strict regex via `allow_origin_regex`.

```python
from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware

app = Starlette(
    middleware=[
        Middleware(
            CORSMiddleware,
            allow_origins=["https://trusted.example.com"],
            allow_credentials=True,
            allow_methods=["GET", "POST"],
            allow_headers=["Authorization", "Content-Type"],
        )
    ]
)
```
