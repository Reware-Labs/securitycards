# Security cards

Repository: `https://github.com/urllib3/urllib3#2.7.0`
Category: input contract definition

## input contract definition

### Validate URL syntax and port ranges using parse_url

**Use when**

When validating untrusted input string URLs and enforcing strict port boundaries before passing them to networking components.

**Secure rules**

**Rule 1: Always catch LocationParseError when calling parse_url() on untrusted input string URLs to reject malformed URLs and out-of-bound port numbers.**

Wrap URL parsing in exception handlers to validate user-supplied URLs before passing them to networking components. Use urllib3.util.parse_url() and catch LocationParseError to handle invalid formats or out-of-range ports safely.

```python
import urllib3
from urllib3.exceptions import LocationParseError

def validate_url(raw_url: str) -> urllib3.util.Url:
    try:
        return urllib3.util.parse_url(raw_url)
    except LocationParseError as err:
        raise ValueError(f"Invalid URL provided: {err}")
```
