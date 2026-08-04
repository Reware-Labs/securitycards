# Security cards

Repository: `https://github.com/aio-libs/aiohttp#v3.14.3`
Category: input interpretation safety

## input interpretation safety

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
