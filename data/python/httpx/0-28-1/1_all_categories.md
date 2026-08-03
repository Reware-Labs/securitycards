# Security cards

Repository: `https://github.com/encode/httpx#0.28.1`

## Category: api contract misuse

### Declare Body Requirements in Custom Authentication Flows

**Use when**

Developing custom authentication flows by subclassing `httpx.Auth` that inspect request or response content.

**Secure rules**

**Rule 1: Explicitly set body requirement flags on custom authentication classes before accessing request or response payloads.**

When creating a custom authentication subclass of `httpx.Auth`, you must explicitly set `requires_request_body = True` or `requires_response_body = True` on the class if your authentication flow inspects `request.content` or `response.content`. Failing to declare these requirements will cause request execution failures or stream-handling bugs.

```python
class SignedAuth(httpx.Auth):
    requires_request_body = True

    def __init__(self, token):
        self.token = token

    def auth_flow(self, request):
        signature = self.sign(request.content)
        request.headers["X-Signature"] = signature
        yield request

    def sign(self, body):
        return "signature_value"
```


## Category: authentication

### Authenticate HTTPX Requests Securely Using Explicit Credentials and Custom Flows

**Use when**

When establishing client authentication, passing credentials, or implementing custom authentication handlers in HTTPX.

**Secure rules**

**Rule 1: Pass explicit authentication parameters using the auth argument**

Provide authentication credentials by explicitly passing the `auth` parameter to the client or request. For HTTP Basic authentication the `auth` argument may be a two-tuple of username and password.

```python
import httpx

with httpx.Client() as client:
    response = client.get(
        "https://example.com/api",
        auth=("my_username", "my_password")
    )
```

**Rule 2: Use Basic authentication exclusively over HTTPS connections.**

HTTP Basic authentication transmits credentials encoded in simple Base64 without transport-layer encryption. Ensure requests target `https://` scheme URLs when using `httpx.BasicAuth` or credential tuples to prevent eavesdropping and interception across the network.

```python
auth = httpx.BasicAuth(username="username", password="secret")
client = httpx.Client(auth=auth)
response = client.get("https://www.example.com/")
```

**Rule 3: Override sync and async auth flows for custom authentication I/O.**

When implementing custom authentication subclasses of `httpx.Auth` that perform I/O, override `.sync_auth_flow()` and `.async_auth_flow()` rather than `.auth_flow()` to defer execution to appropriate synchronous or asynchronous contexts.

```python
import httpx

class CustomHeaderAuth(httpx.Auth):
    requires_request_body = False

    def __init__(self, token: str):
        self.token = token

    def auth_flow(self, request: httpx.Request):
        request.headers["Authorization"] = f"Bearer {self.token}"
        yield request

    async def async_auth_flow(self, request: httpx.Request):
        request.headers["Authorization"] = f"Bearer {self.token}"
        yield request
```

**Rule 4: Explicitly disable client authentication per request when accessing public resources.**

When a client is initialized with a default `auth` handler, override it per-request by passing `auth=None` when making requests to public or third-party endpoints to prevent leaking bearer tokens or credentials to unauthorized hosts.

```python
import httpx

auth = ("username", "secret-password")
with httpx.Client(auth=auth) as client:
    client.get("https://example.org/api/user")
    client.get("https://example.org/api/public", auth=None)
```


## Category: configuration source integrity

### Disable Environment Variable Proxy Reading in Untrusted Runtimes

**Use when**

Instantiating an `httpx.Client` or `httpx.AsyncClient` in multi-tenant or untrusted environments where ambient environment variables may be manipulated by external actors.

**Secure rules**

**Rule 1: Disable ambient environment proxy lookup by setting `trust_env=False` on client instantiation.**

By default, HTTPX reads ambient proxy settings from the environment. In untrusted or multi-tenant runtimes, explicitly pass `trust_env=False` to prevent external injection of proxy variables from redirecting client traffic.

```python
import httpx

client = httpx.Client(trust_env=False)
response = client.get("https://internal.service.local/health")
```


## Category: cryptography

### Configure Explicit SSL Contexts and Maintain Certificate Verification

**Use when**

Configuring client certificate validation, custom CA bundles, or connecting over HTTPS using HTTPX.

**Secure rules**

**Rule 1: Maintain certificate verification and never disable TLS checks.**

Keep the default verification settings active by retaining `verify=True` or supplying a configured `ssl.SSLContext` instance. Never pass `verify=False` in production environments, as doing so completely disables certificate authority and host identity checks.

```python
import ssl
import certifi
import httpx

ctx = ssl.create_default_context(cafile=certifi.where())
client = httpx.Client(verify=ctx)
```

**Rule 2: Use explicit SSL contexts for custom certificate authorities and client certificates.**

Avoid passing file path strings or `cert` parameters directly to `verify=` or client initializations, as these legacy patterns trigger deprecation warnings in HTTPX 0.28.x. Instead, instantiate an explicit `ssl.SSLContext` using `ssl.create_default_context()` and load custom CA bundles or client certificate chains directly onto the context before passing it to `verify`.

```python
import ssl
import httpx

ctx = ssl.create_default_context(cafile='/path/to/ca_bundle.pem')
ctx.load_cert_chain(certfile='/path/to/client.crt', keyfile='/path/to/client.key')

client = httpx.Client(verify=ctx)
```

**Rule 3: Set the SNI hostname extension when requesting explicit IP addresses.**

When making HTTPS requests directly to an IP address instead of using DNS resolution, explicitly supply the expected domain name using the `sni_hostname` request extension so HTTPX performs proper server name indication and certificate hostname validation.

```python
import httpx

client = httpx.Client()
headers = {"Host": "www.encode.io"}
extensions = {"sni_hostname": "www.encode.io"}
response = client.get(
    "https://185.199.108.153/path",
    headers=headers,
    extensions=extensions
)
```


### Configure Secure TLS and Certificate Verification in HTTPX

**Use when**

Instantiating HTTPX clients or making HTTPS requests where TLS certificate verification, custom CA bundles, or IP-based SNI mapping must be securely enforced.

**Secure rules**

**Rule 1: Configure SSL and TLS verification settings during client initialization rather than passing per-request SSL arguments.**

When using HTTPX `Client` instances, pass TLS configuration parameters upon client instantiation. If distinct TLS configurations are needed, instantiate separate `Client` instances for each configuration because per-request SSL arguments are not supported.

```python
import httpx
import ssl

client = httpx.Client(verify=True)
response = client.get('https://example.com')

custom_ctx = ssl.create_default_context()
custom_client = httpx.Client(verify=custom_ctx)
```

**Rule 2: Set the sni_hostname request extension when connecting directly to IP addresses for TLS verification.**

When making HTTPS requests directly to an explicit IP address rather than a domain name, pass the expected server domain using the `sni_hostname` request extension so HTTPX can perform correct certificate hostname verification.

```python
import httpx

client = httpx.Client()
headers = {"Host": "www.encode.io"}
extensions = {"sni_hostname": "www.encode.io"}
response = client.get(
    "https://185.199.108.153/path",
    headers=headers,
    extensions=extensions
)
```

**Rule 3: Use explicit `ssl.SSLContext` objects for custom certificates and client credentials.**

Avoid passing deprecated string file paths or `cert` parameters directly. Build an explicit `ssl.SSLContext` using `ssl.create_default_context()` and load client certificate chains using `ctx.load_cert_chain()`.

```python
import ssl
import httpx

ctx = ssl.create_default_context(cafile="/path/to/ca_bundle.pem")
ctx.load_cert_chain(certfile="/path/to/client.crt", keyfile="/path/to/client.key")
client = httpx.Client(verify=ctx)
```

**Rule 4: Explicitly inspect SSL environment variables when building custom `SSLContext` objects.**

Because HTTPX does not automatically read `SSL_CERT_FILE` or `SSL_CERT_DIR` environment variables when custom contexts are used, explicitly retrieve and pass them to the `ssl.SSLContext` constructor.

```python
import os
import ssl
import certifi
import httpx

ctx = ssl.create_default_context(
    cafile=os.environ.get("SSL_CERT_FILE", certifi.where()),
    capath=os.environ.get("SSL_CERT_DIR"),
)
client = httpx.Client(verify=ctx)
```

**Rule 5: Keep default TLS verification enabled and never disable it in production code.**

Rely on HTTPX's default SSL verification or supply an authenticated `ssl.SSLContext` object. Never pass `verify=False` in production code to prevent man-in-the-middle attacks.

```python
import httpx

client = httpx.Client()
response = client.get("https://example.com")
```


## Category: injection

### Handle InvalidURL exceptions when parsing untrusted URLs

**Use when**

Constructing HTTP requests from untrusted user input that may contain control characters or malformed syntax.

**Secure rules**

**Rule 1: Catch httpx.InvalidURL exceptions when passing untrusted user input to request methods.**

HTTPX's URL parser explicitly rejects URLs containing ASCII non-printable control characters by raising `httpx.InvalidURL`. Wrap client request calls in a try-except block catching `httpx.InvalidURL` to ensure control-character injection attempts do not crash application logic.

```python
import httpx

def fetch_user_url(raw_url: str) -> httpx.Response | None:
    try:
        return httpx.get(raw_url)
    except httpx.InvalidURL:
        return None
```


## Category: input interpretation safety

### Validate and parse untrusted URLs using HTTPX native parsing

**Use when**

When processing external or untrusted URL strings to prevent parser differentials and invalid input interpretations before executing HTTP requests.

**Secure rules**

**Rule 1: Instantiate `httpx.URL` and catch `httpx.InvalidURL` exceptions when handling external or untrusted URL strings.**

Always parse user-supplied URL strings with `httpx.URL` and handle `httpx.InvalidURL` before executing requests to ensure strict WHATWG URL specification compliance and prevent parser differential vulnerabilities.

```python
import httpx

def safe_fetch(user_supplied_url: str):
    try:
        url = httpx.URL(user_supplied_url)
    except httpx.InvalidURL:
        raise ValueError("Provided string is not a valid URL")

    if url.scheme not in ("http", "https"):
        raise ValueError("Unsupported URL scheme")

    with httpx.Client() as client:
        return client.get(url)
```


## Category: interface protocol hardening

### Configure explicit transport retries for transient connection errors

**Use when**

Configuring HTTPX clients to handle connection failures and transient network timeouts safely using transport-level retries.

**Secure rules**

**Rule 1: Configure explicit connection retries on `httpx.HTTPTransport` using the `retries` parameter.**

Explicitly set the `retries` parameter on `httpx.HTTPTransport` to handle transient connection errors safely. Note that HTTPX transport retries only apply to `httpx.ConnectError` and `httpx.ConnectTimeout`, and do not automatically retry read/write errors or HTTP 5xx responses.

```python
import httpx

transport = httpx.HTTPTransport(retries=3)
with httpx.Client(transport=transport) as client:
    response = client.get("https://example.com")
```


## Category: network boundary

### Control Redirect Boundary Enforcement and Destination Validation

**Use when**

Making HTTP requests where automatic redirects might cross network boundaries or expose sensitive credentials to untrusted origins.

**Secure rules**

**Rule 1: Keep redirect following disabled or explicitly inspect redirect destinations before proceeding.**

Maintain `follow_redirects=False` by default or strictly validate destination URLs before following HTTP redirects to prevent unintended credential leakage and SSRF.

```python
import httpx

response = httpx.get("http://example.com/", follow_redirects=False)
if response.is_redirect:
    next_url = response.next_request.url
    # Perform boundary and scheme checks on next_url before making a request
```


## Category: resource exhaustion

### Configure Explicit Timeouts and Connection Pool Limits for HTTP Requests

**Use when**

When building HTTP client requests and managing connection transports to prevent thread starvation and resource exhaustion.

**Secure rules**

**Rule 1: Always configure explicit non-zero timeouts and avoid using unbounded client settings.**

Set explicit network and connection timeouts using `httpx.Timeout` or pass a direct numeric timeout value to prevent stalled connections from hanging indefinitely and consuming worker threads.

```python
import httpx

custom_timeout = httpx.Timeout(timeout=5.0, connect=2.0, pool=3.0)
client = httpx.Client(timeout=custom_timeout)
```

**Rule 2: Define explicit connection pool limits on transports to prevent unbounded socket allocation.**

Configure connection limits on `HTTPTransport` and `AsyncHTTPTransport` using custom `Limits` objects to protect system file descriptors and prevent socket exhaustion under heavy application traffic.

```python
import httpx

limits = httpx.Limits(max_connections=100, max_keepalive_connections=20)
transport = httpx.HTTPTransport(limits=limits)
client = httpx.Client(transport=transport)
```


### Stream Large Response Payloads and Enforce Size Limits

**Use when**

When downloading files or retrieving large response bodies to prevent out-of-memory crashes and denial of service.

**Secure rules**

**Rule 1: Use response streaming to validate content size before reading payloads into memory.**

Leverage `httpx.stream()` to inspect response content length or process incoming chunks incrementally, avoiding full memory allocation of large unbounded payloads.

```python
import httpx

MAX_ALLOWED_BYTES = 10 * 1024 * 1024

with httpx.stream("GET", "https://example.com/large-file") as response:
    content_length = int(response.headers.get("Content-Length", 0))
    if content_length < MAX_ALLOWED_BYTES:
        response.read()
        data = response.text
    else:
        raise ValueError("Response payload exceeds maximum allowed size.")
```


## Category: secret handling

### Prevent sensitive credential leaks across requests and redirects

**Use when**

When developers configure client instances with default headers or custom authentication properties, or manage redirection behaviors.

**Secure rules**

**Rule 1: Strip sensitive client default headers before dispatching third-party requests**

Client-level default headers are automatically included on all outgoing requests sent through that client instance, which can accidentally leak secret tokens or API keys to unintended hosts. Use `client.build_request()` and explicitly remove sensitive credentials before dispatching requests to public or third-party URLs.

```python
import httpx

headers = {"X-Api-Key": "secret-api-token", "X-Client-ID": "ABC123"}

with httpx.Client(headers=headers) as client:
    request = client.build_request("GET", "https://public-api.example.com")
    del request.headers["X-Api-Key"]
    response = client.send(request)
```

**Rule 2: Prevent sensitive header leaks during cross-origin redirects**

While HTTPX automatically strips standard `Authorization` headers on cross-origin redirects, custom API key headers are not automatically purged. When `follow_redirects` is enabled, ensure custom sensitive headers are not forwarded to untrusted third-party redirect locations, or manage redirects explicitly.

```python
import httpx

with httpx.Client(follow_redirects=False) as client:
    response = client.get(
        "https://api.example.com/data",
        headers={"X-Api-Key": "secret-token-123"}
    )
    if response.is_redirect:
        target_url = response.headers["location"]
        if target_url.startswith("https://api.example.com/"):
            response = client.get(target_url, headers={"X-Api-Key": "secret-token-123"})
```


### Redact and sanitize sensitive credentials in logs and telemetry outputs

**Use when**

When developers are logging HTTP request objects, response headers, URLs, or implementing request event hooks and diagnostics.

**Secure rules**

**Rule 1: Rely on built-in credential obfuscation for URL representations**

When logging `httpx.URL` instances containing embedded basic authentication credentials, use `repr()` or string formatting specifiers like `%r` to automatically mask passwords as `[secure]` instead of converting the URL to a string.

```python
import httpx

url = httpx.URL("https://user:secret_pass@example.com/api")
logger.info("Connecting to %r", url)
```

**Rule 2: Sanitize custom credentials in request headers before logging**

Because HTTPX automatically obfuscates standard authorization headers but does not mask custom sensitive headers like API keys or cookies, developers must explicitly filter or redact custom credential keys before recording header dictionaries in application logs or event hooks.

```python
def log_request(request: httpx.Request) -> None:
    headers = dict(request.headers)
    if "authorization" in headers:
        headers["authorization"] = "[REDACTED]"
    logger.info("Outgoing request to %s with headers %s", request.url, headers)

client = httpx.Client(event_hooks={"request": [log_request]})
```


## Category: security control integrity

### Enforce Automated HTTP Status Validation Using Response Hooks

**Use when**

When registering response event hooks on an HTTPX client to consistently enforce status code checking across all operations.

**Secure rules**

**Rule 1: Register a response event hook that calls response.raise_for_status() to automatically enforce status code checks globally.**

Use event hooks to guarantee that every client response triggers an `httpx.HTTPStatusError` on HTTP 4xx or 5xx responses, preventing application logic flaws or security control bypasses from unhandled error responses.

```python
import httpx

def check_status(response: httpx.Response) -> None:
    response.raise_for_status()

client = httpx.Client(event_hooks={"response": [check_status]})

try:
    response = client.get("https://api.example.com/data")
except httpx.HTTPStatusError as exc:
    # Handle HTTP error response
    pass
```


## Category: session management

### Isolate Client Instances and Configure Cookies at Initialization

**Use when**

Managing session state and cookie persistence across requests when using `httpx.Client`.

**Secure rules**

**Rule 1: Configure persistent session cookies during client instantiation to prevent cross-session leakage.**

Supply persistent cookies upon client creation rather than passing per-request cookies or reusing a single client across multiple user sessions. Reusing a single client instance causes session cookies set by one server response to persist and automatically attach to subsequent requests, potentially leaking sensitive session tokens across distinct user contexts.

```python
import httpx

# Configure cookies at client initialization per session
def fetch_user_data(user_cookies: dict) -> httpx.Response:
    with httpx.Client(cookies=user_cookies) as client:
        return client.get("https://example.org/echo_cookies")
```
