# Security cards

Repository: `https://github.com/Kludex/starlette#1.3.1`

## Category: access control

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


## Category: api contract misuse

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


## Category: authentication

### Implement Custom Authentication Backends Securely in Starlette

**Use when**

When building custom authentication backends in Starlette to establish and verify user identity from request headers or credentials.

**Secure rules**

**Rule 1: Validate and process credentials within custom authentication backends, returning an appropriate tuple on success or raising an error on failure.**

When creating a custom backend by subclassing `AuthenticationBackend`, ensure the `authenticate()` method returns a tuple of `(AuthCredentials, BaseUser)` upon successful credential verification. Catch credential parsing and decoding exceptions gracefully and raise `AuthenticationError` with a clean description rather than allowing unhandled exceptions to bubble up as 500 server errors.

```python
import base64
import binascii
from starlette.authentication import AuthenticationBackend, AuthenticationError, AuthCredentials, SimpleUser

class CustomBasicAuthBackend(AuthenticationBackend):
    async def authenticate(self, conn):
        if 'Authorization' not in conn.headers:
            return None
        auth = conn.headers['Authorization']
        try:
            scheme, credentials = auth.split()
            if scheme.lower() != 'basic':
                return None
            decoded = base64.b64decode(credentials).decode('ascii')
        except (ValueError, UnicodeDecodeError, binascii.Error):
            raise AuthenticationError('Invalid basic auth credentials')
        username, _, password = decoded.partition(':')
        return AuthCredentials(['authenticated']), SimpleUser(username)
```


## Category: configuration source integrity

### Enforce Configuration Mutability Control Using Starlette Environ

**Use when**

Accessing and managing environment variables programmatically during application setup or initialization to prevent runtime mutation and configuration inconsistency.

**Secure rules**

**Rule 1: Use Starlette's `Environ` mapping or `starlette.config.environ` to track and prevent unauthorized environment variable modifications after application configuration has been evaluated.**

Use `starlette.config.environ` or instantiate `Environ` to read environment settings safely. Starlette tracks accessed variables and enforces configuration mutability control by raising an error if a variable is mutated or deleted after evaluation, preventing unexpected state changes and runtime tampering.

```python
from starlette.config import Environ, EnvironError

environ = Environ()
is_testing = environ.get("TESTING", "False")

try:
    environ["TESTING"] = "True"
except EnvironError:
    pass
```


## Category: csrf

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


## Category: file handling

### Validate File Paths and Containment for FileResponse

**Use when**

Handling user-influenced file paths when serving files via `FileResponse`.

**Secure rules**

**Rule 1: Serve request-addressable files from a configured directory with `StaticFiles`**

When files are exposed under a URL prefix, mount `StaticFiles` with the directory from which they may be served. `StaticFiles` rejects absolute request paths and verifies that resolved paths remain inside the configured directory before returning a file response. Requests that do not resolve to an available file receive a 404 response.

```python
from starlette.applications import Starlette
from starlette.routing import Mount
from starlette.staticfiles import StaticFiles

routes = [
    Mount(
        "/downloads",
        app=StaticFiles(directory="/app/storage/uploads"),
        name="downloads",
    )
]

app = Starlette(routes=routes)
```


## Category: input contract definition

### Enforce route parameter validation using typed path converters

**Use when**

Defining URL route patterns and path parameters in Starlette to ensure malformed inputs are rejected before reaching endpoint handlers.

**Secure rules**

**Rule 1: Define path parameters with explicit type converters in Starlette route patterns**

Use explicit type converters such as `{param:int}` or `{param:uuid}` in your Starlette `Route` definitions. Starlette's router enforces these type constraints during URL matching and automatically rejects invalid parameter types early at the routing layer with a `404` response.

```python
from starlette.routing import Route
from starlette.responses import JSONResponse
from starlette.requests import Request

def get_user(request: Request) -> JSONResponse:
    user_id = request.path_params["user_id"]
    return JSONResponse({"user_id": str(user_id)})

routes = [
    Route("/users/{user_id:uuid}", endpoint=get_user, name="get-user")
]
```


## Category: interface protocol hardening

### Configure CORSMiddleware security headers safely for credentialed and private network requests

**Use when**

Configuring Starlette CORSMiddleware security headers to restrict cross-origin access, handle credentials securely, and control private network access.

**Secure rules**

**Rule 1: Restrict allowed origins and disable private network access when using CORSMiddleware unless external interaction with internal networks is explicitly required.**

Combine restrictive `allow_origins` or strict regular expressions with `allow_credentials=True` to rely on automatic `Vary` header management, and ensure `allow_private_network` is set to `False` to prevent unauthorized public-to-private cross-origin requests.

```python
Middleware(
    CORSMiddleware,
    allow_origins=["https://app.example.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
    allow_private_network=False
)
```


## Category: network boundary

### Configure trusted proxy headers and remote address validation securely

**Use when**

Configuring access controls, rate limits, or security middleware that depend on client IP addresses and network trust boundaries behind reverse proxies.

**Secure rules**

**Rule 1: Use proxy-aware middleware to determine client addresses behind a proxy**

`request.client` reads the client address supplied in the ASGI scope and does not itself process forwarding headers. When the application is served behind a proxy and requires the forwarded client address, use proxy-aware middleware such as Uvicorn’s `ProxyHeadersMiddleware`, which determines client information from `X-Forwarded-For` and `X-Forwarded-Proto`.


## Category: output encoding

### Configure Jinja2 Environment with Explicit Autoescaping in Starlette

**Use when**

Rendering dynamic user input into HTML templates using Starlette templates and a custom `jinja2.Environment`.

**Secure rules**

**Rule 1: Use Starlette’s autoescaping template configuration for HTML templates**

Initialize `Jinja2Templates` with the `directory` argument when using Starlette’s standard template configuration. Starlette enables autoescaping by default for `.html`, `.htm`, and `.xml` templates, escaping user-provided content before rendering it and protecting against Cross-Site Scripting vulnerabilities.

```python
from starlette.templating import Jinja2Templates

templates = Jinja2Templates(directory="templates")
```


## Category: resource exhaustion

### Limit Request Body and Form Parsing Size to Prevent Resource Exhaustion

**Use when**

Handling incoming HTTP requests, JSON payloads, or multipart/form-data uploads in Starlette endpoints.

**Secure rules**

**Rule 1: Configure explicit limits when parsing form data**

Pass appropriate `max_files`, `max_fields`, and `max_part_size` limits to `request.form()`. Starlette enforces these limits while parsing form submissions, preventing an unlimited number of files or fields from consuming excessive CPU and memory.

```python
from starlette.responses import JSONResponse

async def submit_form(request):
    async with request.form(
        max_files=5,
        max_fields=20,
        max_part_size=512 * 1024,
    ) as form:
        return JSONResponse({"parsed_items": len(form)})
```


## Category: runtime environment hardening

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


## Category: secret handling

### Protect sensitive credentials using Starlette Secret datastructures

**Use when**

When loading session keys, application secrets, or sensitive configuration values into Starlette middleware or components.

**Secure rules**

**Rule 1: Load sensitive credentials and keys into Starlette Secret datastructures from secure configuration sources or environment variables.**

Pass session secret keys as `Secret` objects loaded from environment variables rather than hardcoding plaintext strings into source code. Store secret keys and sensitive credentials in environment variables or non-committed `.env` files, and read sensitive values using Starlette's `Secret` datastructure. Explicitly cast `Secret` instances to `str` only at the exact point of usage to prevent unintentional string representation leakage during logging, introspection, or error reporting.

```python
import os
from starlette.datastructures import Secret
from starlette.middleware.sessions import SessionMiddleware

secret_key = Secret(os.environ.get("SESSION_SECRET_KEY", ""))
middleware = SessionMiddleware(app, secret_key=secret_key)
```


## Category: security control integrity

### Propagate security context across middleware boundaries using request state

**Use when**

When managing authentication states, audit metadata, or security context across middleware boundaries and endpoint handlers in Starlette.

**Secure rules**

**Rule 1: Use request.state instead of contextvars to propagate security context and state changes across middleware boundaries.**

Because contextvars modified inside downstream endpoints or inner middleware do not propagate context changes backward to outer middleware due to async task context copying, developers must rely on `request.state` rather than `contextvars` to reliably propagate security contexts, authentication states, or audit metadata.

```python
class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request.state.user_id = None
        response = await call_next(request)
        user_id = getattr(request.state, "user_id", "anonymous")
        response.headers["X-Audit-User"] = user_id
        return response
```


## Category: session management

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
