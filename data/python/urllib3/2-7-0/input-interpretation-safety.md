# Security cards

Repository: `https://github.com/urllib3/urllib3#2.7.0`
Category: input interpretation safety

## input interpretation safety

### Sanitize and normalize URLs to prevent control character and header injection

**Use when**

Constructing URLs with user-supplied components or parsing hostnames and parameters in urllib3

**Secure rules**

**Rule 1: Parse untrusted URLs with `parse_url()` and explicitly validate the resulting components**

Use `urllib3.util.parse_url()` and handle `LocationParseError` to reject malformed URLs. After parsing, validate security-sensitive components such as the scheme, hostname, and port against application policy. Do not assume that parsing alone makes an arbitrary URL safe for network access.

```python
from urllib3.exceptions import LocationParseError
from urllib3.util import parse_url

ALLOWED_SCHEMES = {"http", "https"}
ALLOWED_HOSTS = {"api.example.com", "services.example.com"}


def validate_url(raw_url: str):
    try:
        parsed = parse_url(raw_url)
    except LocationParseError as err:
        raise ValueError(f"Invalid URL: {err}") from err

    if parsed.scheme not in ALLOWED_SCHEMES:
        raise ValueError("Unsupported URL scheme")

    if parsed.host not in ALLOWED_HOSTS:
        raise ValueError("Untrusted hostname")

    return parsed
```
