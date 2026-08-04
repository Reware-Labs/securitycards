# Security cards

Repository: `https://github.com/encode/httpx#0.28.1`
Category: input interpretation safety

## input interpretation safety

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
