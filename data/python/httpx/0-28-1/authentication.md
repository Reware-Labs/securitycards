# Security cards

Repository: `https://github.com/encode/httpx#0.28.1`
Category: authentication

## authentication

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
