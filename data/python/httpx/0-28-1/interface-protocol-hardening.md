# Security cards

Repository: `https://github.com/encode/httpx#0.28.1`
Category: interface protocol hardening

## interface protocol hardening

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
