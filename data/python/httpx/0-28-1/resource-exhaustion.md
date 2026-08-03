# Security cards

Repository: `https://github.com/encode/httpx#0.28.1`
Category: resource exhaustion

## resource exhaustion

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
