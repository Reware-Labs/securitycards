# Security cards

Repository: `https://github.com/psf/requests#v2.34.2`
Category: boundary control

## boundary control

### Validate URL Scheme and Domain Boundaries Before Request Execution

**Use when**

When accepting dynamic or user-supplied target URL strings before passing them to requests functions.

**Secure rules**

**Rule 1: Validate target URL schemes and host structures before passing dynamic URLs to `requests`.**

Check that the URL has an explicit and safe URI scheme and a valid network location prior to making network calls. This prevents requests from failing at runtime or encountering unexpected protocol parsing behaviors when processing untrusted input.

```python
import requests
from urllib.parse import urlparse

def fetch_url(target_url: str):
    parsed = urlparse(target_url)
    if parsed.scheme not in ("https", "http") or not parsed.netloc:
        raise ValueError(f"Untrusted or invalid target URL: {target_url}")
    return requests.get(target_url)
```
