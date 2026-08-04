# Security cards

Repository: `https://github.com/urllib3/urllib3#2.7.0`
Category: boundary control

## boundary control

### Enforce boundary checks using parsed authority hostnames

**Use when**

Validating untrusted URLs or enforcing host allowlists at a system boundary before passing state to trusted logic or network clients.

**Secure rules**

**Rule 1: Extract and validate target hostnames using urllib3 parse_url to prevent parser differential attacks and domain spoofing at trust boundaries.**

When checking untrusted URL inputs at a system boundary, use `urllib3.util.parse_url()` to extract the hostname. This ensures that characters like backslashes are correctly parsed as part of the path component rather than host delimiters, preventing attackers from bypassing allowlists or SSRF filters via inconsistent parsing.

```python
from urllib3.util import parse_url

def is_allowed_host(url_string: str) -> bool:
    parsed = parse_url(url_string)
    return parsed.host in {"api.example.com", "services.example.com"}
```
