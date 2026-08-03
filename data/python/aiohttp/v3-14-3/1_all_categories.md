# Security cards

Repository: `https://github.com/aio-libs/aiohttp#v3.14.3`

## Category: access control

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


## Category: api contract misuse

### Avoid parallel receive calls on a single WebSocket object

**Use when**

Developing asynchronous network applications or web services using aiohttp Web-Sockets where multiple tasks might interact with a single WebSocket stream.

**Secure rules**

**Rule 1: Ensure that only a single asyncio task handles incoming receive calls or iteration over a web.WebSocketResponse.**

Do not invoke receive concurrently from multiple tasks on a single WebSocket object. Ensure that iteration and receive calls are managed by a single dedicated reader task or loop to prevent violating aiohttp's WebSocket state machine contracts.

```python
async def handler(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    task = asyncio.create_task(send_updates(ws))
    try:
        async for msg in ws:
            process_message(msg)
    finally:
        task.cancel()
    return ws
```


### Properly Handle Request and Response Errors in Client and Server Workflows

**Use when**

Building asynchronous clients, web applications, or WebSocket message loops using aiohttp where request failures, client disconnections, protocol errors, or response statuses must be handled safely.

**Secure rules**

**Rule 1: Configure automatic HTTP error response handling or explicitly catch client exceptions.**

Configure `raise_for_status=True` on `ClientSession` or explicitly catch exceptions inheriting from `aiohttp.ClientError` to prevent HTTP errors and network failures from causing unhandled application crashes.

```python
async with aiohttp.ClientSession(raise_for_status=True) as session:
    try:
        async with session.get('https://example.com/api') as response:
            data = await response.json()
    except aiohttp.ClientError as err:
        logger.error('HTTP request failed: %s', err)
```

**Rule 2: Raise HTTP exception instances instead of returning them in web request handlers.**

Use `raise` when triggering HTTP status exceptions like `web.HTTPBadRequest` in request handlers instead of returning them as response objects to ensure proper exception propagation and middleware processing.

```python
async def handler(request):
    if not request.query.get('id'):
        raise web.HTTPBadRequest(reason='Missing id parameter')
    return web.Response(text='OK')
```

**Rule 3: Catch parsing and decoding exceptions when processing request bodies and headers.**

Explicitly catch `json.JSONDecodeError`, `ValueError`, and `binascii.Error` when parsing incoming request bodies or headers to return controlled 400 or 401 error responses instead of leaking tracebacks.

```python
async def handle_json_data(request: web.Request) -> web.Response:
    try:
        data = await request.json()
        return web.json_response({'status': 'ok', 'data': data})
    except JSONDecodeError:
        return web.json_response({'error': 'Invalid JSON'}, status=400)
```


## Category: boundary control

### Filter cookies using yarl URL objects at the client boundary

**Use when**

When managing or filtering cookies within `aiohttp.ClientSession` or `CookieJar` to ensure boundary controls prevent cross-origin cookie leakage.

**Secure rules**

**Rule 1: Use CookieJar.filter_cookies(url) with yarl.URL objects to enforce domain and path isolation instead of manually constructing headers.**

Always pass a valid `yarl.URL` object to `CookieJar.filter_cookies()` to let `aiohttp` handle domain matching, IDNA normalization, path restrictions, and expiration checks automatically at the trust boundary.

```python
from aiohttp import CookieJar
from yarl import URL

jar = CookieJar()
request_url = URL("https://sub.example.com/path/to/resource")
matched_cookies = jar.filter_cookies(request_url)
```


## Category: configuration source integrity

### Disable implicit proxy environment variable reading in ClientSession

**Use when**

Configuring aiohttp client sessions where environment variables and netrc files should not dictate proxy routing or authentication credentials.

**Secure rules**

**Rule 1: Leave trust_env set to False on ClientSession to prevent automatically reading proxy settings and authentication credentials from environment variables or ~/.netrc files.**

Explicitly set `trust_env=False` when initializing `aiohttp.ClientSession()` to ensure that security-sensitive network routing and configuration are not implicitly controlled by untrusted environment variables or local files.

```python
import aiohttp

async with aiohttp.ClientSession(trust_env=False) as session:
    async with session.get("https://example.com") as resp:
        text = await resp.text()
```


## Category: deserialization

### Use restricted unpickling and JSON serialization for cookie jar loading

**Use when**

When loading cookie files into `aiohttp.CookieJar` where untrusted data could lead to arbitrary object construction via insecure pickling.

**Secure rules**

**Rule 1: Load cookie jars using safe JSON parsing and restrict unpickling classes to a strict allowlist**

Use `CookieJar.load()` to restore cookie stores safely. When loading legacy pickled cookie stores, `CookieJar.load()` relies on `_RestrictedCookieUnpickler` to restrict object construction exclusively to an approved allowlist of cookie-related builtins and container types, preventing arbitrary object injection.

```python
jar = aiohttp.CookieJar()
jar.save("/path/to/cookies.json")

loaded_jar = aiohttp.CookieJar()
loaded_jar.load("/path/to/cookies.json")
```


## Category: file handling

### Validate Uploaded Filenames and Restrict Static File Symlinks

**Use when**

Handling file uploads from multipart requests and configuring static file routes in aiohttp web applications.

**Secure rules**

**Rule 1: Sanitize uploaded filenames from multipart fields before performing filesystem operations.**

Always validate and sanitize client-provided filenames extracted from multipart fields such as `field.filename` before passing them into filesystem operations. Use `os.path.basename()` to strip directory path separators and constrain destination paths to the intended storage directory.

```python
import os
from pathlib import Path

async def safe_upload_handler(request):
    reader = await request.multipart()
    field = await reader.next()
    if field and field.name == 'mp3':
        filename = os.path.basename(field.filename)
        destination = Path('/spool/yarrr-media/mp3/') / filename
        with open(destination, 'wb') as f:
            while True:
                chunk = await field.read_chunk()
                if not chunk:
                    break
                f.write(chunk)
    return web.Response(text='Uploaded safely')
```

**Rule 2: Disable symlink traversal when configuring static file routes.**

Do not set `follow_symlinks=True` when configuring static file routes using `web.static()`. Keeping this option disabled prevents clients from escaping the static file sandbox via symbolic links that lead outside the intended directory.

```python
from aiohttp import web

app = web.Application()
app.add_routes([web.static('/static', '/path/to/static')])
```


## Category: input driven boundary selection

### Restrict and validate user-supplied destination URLs

**Use when**

Making asynchronous requests to target URLs provided by untrusted users using `session.get()`.

**Secure rules**

**Rule 1: Validate target URL schemes and handle client exceptions to prevent non-HTTP protocol usage.**

Catch `InvalidURL`, `NonHttpUrlClientError`, and `NonHttpUrlRedirectClientError` exceptions when processing user-supplied target URLs to enforce valid HTTP or HTTPS endpoints and prevent unexpected protocol handling.

```python
import aiohttp
from aiohttp.client_exceptions import InvalidURL, NonHttpUrlClientError

async def fetch_user_url(session: aiohttp.ClientSession, url: str):
    try:
        async with session.get(url) as response:
            return await response.text()
    except (InvalidURL, NonHttpUrlClientError) as err:
        raise ValueError(f"Invalid or non-HTTP URL: {url}") from err
```


## Category: input interpretation safety

### Canonicalize and Validate Untrusted Input Representations

**Use when**

Processing incoming request paths, IP addresses, cookie parameters, and query strings where alternate, non-canonical, or encoded representations could bypass authorization or filtering checks.

**Secure rules**

**Rule 1: Use URL-decoded request paths for authorization and routing checks**

Perform path matching, authorization checks, and path validation using the decoded `request.path` attribute rather than `request.raw_path` to prevent access control bypasses from percent-encoded path data.

```python
async def handler(request: web.Request) -> web.Response:
    if request.path.startswith("/admin/"):
        raise web.HTTPForbidden(reason="Access denied")
    return web.Response(text="Welcome")
```

**Rule 2: Enforce strict canonical checks on IPv4 host strings**

Explicitly reject non-canonical representations such as octal notation, decimal integers, or non-ASCII digits using strict canonical IPv4 validation helpers like `is_canonical_ipv4_address` before evaluating IP filtering logic.

```python
from aiohttp.helpers import is_canonical_ipv4_address

def is_safe_ip(host: str) -> bool:
    if not is_canonical_ipv4_address(host):
        return False
    return host != '127.0.0.1'
```


## Category: interface protocol hardening

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


## Category: network boundary

### Validate Proxy Headers and Configure Trusted Origins in Network Boundaries

**Use when**

Configuring request proxy settings, parsing proxy headers behind a reverse proxy, or managing cookie security origins in aiohttp.

**Secure rules**

**Rule 1: Validate reverse proxy headers against trusted proxy IPs before updating the request context.**

Do not rely on request proxy headers directly for security enforcement without validation. Verify that the request originates from a trusted proxy IP before updating scheme or host attributes.

```python
async def handler(request: web.Request) -> web.Response:
    if request.remote == "10.0.0.1":
        scheme = request.headers.get("X-Forwarded-Proto", request.scheme)
        host = request.headers.get("X-Forwarded-Host", request.host)
        request = request.clone(scheme=scheme, host=host)
    return web.Response(text=f"Host: {request.host}, Scheme: {request.scheme}")
```

**Rule 2: Avoid HTTPS Scheme in Environment Proxy Settings.**

Configure environment proxies using `http://` URL schemes rather than `https://` or `wss://` schemes. Environment proxy resolution in `aiohttp` silently ignores proxy URLs with https and wss schemes and falls back to unproxied connections.

```python
import os
import aiohttp

os.environ['HTTP_PROXY'] = 'http://proxy.example.com:8080'
os.environ['HTTPS_PROXY'] = 'http://proxy.example.com:8080'

async with aiohttp.ClientSession() as session:
    async with session.get('https://example.com') as resp:
        pass
```


## Category: output encoding

### Prevent Cross-Site Scripting by Encoding HTML and Setting Content Types

**Use when**

Rendering dynamic user input or serving static files in `aiohttp` web applications to prevent browser-based script execution.

**Secure rules**

**Rule 1: Rely on built-in HTML escaping when enabling static directory indexing**

When configuring directory indexing via `app.router.add_static(..., show_index=True)`, `aiohttp` automatically escapes HTML entities in file and directory names. Rely on this built-in mechanism instead of generating manual, unescaped index pages.

```python
app = web.Application()
app.router.add_static('/static', '/path/to/static', show_index=True)
```

**Rule 2: Set explicit content types and properly escape dynamic response text**

When returning HTTP responses containing user-controlled input using `Response`, `StreamResponse`, or `json_response`, explicitly define the `content_type` and `charset` properties. Ensure HTML content is properly escaped using standard escaping libraries like `html.escape` before writing it to response text.

```python
from aiohttp import web
import html

async def handle_user_input(request: web.Request) -> web.Response:
    user_name = request.query.get('name', '')
    escaped_name = html.escape(user_name)
    return web.Response(
        text=f'<h1>Hello {escaped_name}</h1>',
        content_type='text/html',
        charset='utf-8'
    )
```


## Category: resource exhaustion

### Configure client connection, header, and timeout limits to prevent resource exhaustion

**Use when**

Developing asynchronous HTTP clients with `aiohttp` to ensure remote endpoints and excessive inputs do not consume unbounded local resources.

**Secure rules**

**Rule 1: Enforce strict size bounds on HTTP response headers and line sizes during client session initialization.**

Specify bounded limits for `max_line_size`, `max_field_size`, and `max_headers` when creating an `aiohttp.ClientSession` to protect against excessive memory consumption caused by malicious or malformed remote servers.

```python
import aiohttp

async with aiohttp.ClientSession(
    max_line_size=8190,
    max_field_size=8190,
    max_headers=128
) as session:
    async with session.get("https://example.com") as resp:
        text = await resp.text()
```

**Rule 2: Set explicit TCP connection pool limits instead of using zero or unlimited settings.**

Configure explicit values for `limit` and `limit_per_host` on `aiohttp.TCPConnector` rather than disabling limits with zero, preventing local file descriptor and memory exhaustion under heavy concurrent client traffic.

```python
import aiohttp

connector = aiohttp.TCPConnector(limit=100, limit_per_host=30)
async with aiohttp.ClientSession(connector=connector) as session:
    async with session.get("https://example.com") as resp:
        pass
```

**Rule 3: Define explicit operation timeout limits to prevent hanging connections.**

Use `aiohttp.ClientTimeout` to establish upper time bounds for request operations such as `total`, `connect`, and `sock_read`, avoiding default timeouts that allow unresponsive servers to hold connection sockets open indefinitely.

```python
timeout = aiohttp.ClientTimeout(total=10, connect=3, sock_read=5)
async with aiohttp.ClientSession(timeout=timeout) as session:
    async with session.get('https://api.example.com/data') as response:
        data = await response.json()
```

**Rule 4: Stream large response payloads instead of reading them completely into memory.**

Avoid loading entire response bodies into RAM with methods like `resp.read()` or `resp.text()` when downloading large files; instead, stream the response content using `resp.content.iter_chunked()`.

```python
with open(filename, 'wb') as fd:
    async for chunk in resp.content.iter_chunked(chunk_size):
        fd.write(chunk)
```

**Rule 5: Ensure client response instances are fully closed or released.**

Manage response lifetimes using asynchronous context managers (`async with`) to guarantee that underlying network connections are properly returned to the connection pool.

```python
async with session.get("https://example.com/api") as response:
    data = await response.json()
```


### Enforce server request size limits and stream multipart uploads to prevent denial of service

**Use when**

Developing asynchronous HTTP servers with `aiohttp.web` to handle large incoming payloads and file uploads safely without exhausting memory or storage.

**Secure rules**

**Rule 1: Configure a strict application-level maximum request payload size.**

Set `client_max_size` on `web.Application` to reject excessively large incoming HTTP request bodies and multipart uploads automatically with a `413 Payload Too Large` error.

```python
app = web.Application(client_max_size=1024 * 1024)

async def upload_handler(request: web.Request) -> web.Response:
    reader = await request.multipart()
    part = await reader.next()
    data = await part.text()
    return web.Response(text="Uploaded")

app.router.add_post("/upload", upload_handler)
```

**Rule 2: Stream multipart file uploads chunk by chunk instead of buffering in memory.**

Do not use `await request.post()` for large file uploads because it reads the entire payload into memory. Instead, process multipart requests via `await request.multipart()` and read data iteratively using `await field.read_chunk()`.

```python
async def store_mp3_handler(request):
    reader = await request.multipart()
    while True:
        part = await reader.next()
        if part is None:
            break
        if part.name == 'mp3':
            with open('/spool/yarrr-media/mp3/file.mp3', 'wb') as f:
                while True:
                    chunk = await part.read_chunk()
                    if not chunk:
                        break
                    f.write(chunk)
    return web.Response(text='File uploaded safely')
```


## Category: runtime environment hardening

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


## Category: secret handling

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


## Category: security control integrity

### Preserve Session-Level Middlewares on Individual Request Overrides

**Use when**

When configuring and executing client requests with `aiohttp.ClientSession` where session-level middlewares handle critical security controls.

**Secure rules**

**Rule 1: Explicitly retain session-level security middlewares when passing per-request middlewares to avoid bypassing critical controls.**

When executing client requests with `aiohttp.ClientSession`, passing a `middlewares` tuple to individual request methods like `session.get()` completely replaces session-level middlewares instead of appending to them. Ensure that all essential session-level security middlewares are explicitly included in any per-request middleware tuples or initialize a separate session instance.

```python
async with ClientSession(middlewares=(auth_middleware,)) as session:
    async with session.get(url, middlewares=(auth_middleware, logging_middleware)) as resp:
        pass
```


## Category: session management

### Explicitly close active WebSockets upon user session termination

**Use when**

Handling user logout or revoking an active user session in an aiohttp server application.

**Secure rules**

**Rule 1: Close all active WebSocket connections belonging to a user when their session is terminated.**

Maintain a registry of active `web.WebSocketResponse` connections mapped to each user. When a user logs out or their session is revoked, iterate through their active WebSocket connections and explicitly invoke `ws.close()` to prevent continued data exchange over persistent connections.

```python
async def logout_handler(request):
    user_id = authenticate_user(request)
    ws_closers = [
        ws.close()
        for ws in request.app[websockets_key][user_id]
        if not ws.closed
    ]
    if ws_closers:
        await asyncio.gather(*ws_closers)
    return web.Response(text='OK')
```
