# Security cards

Repository: `https://github.com/encode/httpx#0.28.1`
Category: network boundary

## network boundary

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
