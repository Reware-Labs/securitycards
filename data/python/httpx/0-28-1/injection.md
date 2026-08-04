# Security cards

Repository: `https://github.com/encode/httpx#0.28.1`
Category: injection

## injection

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
