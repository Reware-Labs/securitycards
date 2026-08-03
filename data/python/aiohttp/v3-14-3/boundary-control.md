# Security cards

Repository: `https://github.com/aio-libs/aiohttp#v3.14.3`
Category: boundary control

## boundary control

### Filter cookies using yarl URL objects at the client boundary

**Use when**

When managing or filtering cookies within `aiohttp.ClientSession` or `CookieJar` to ensure boundary controls prevent cross-origin cookie leakage.

**Secure rules**

**Rule 1: Use CookieJar.filter_cookies(url) with yarl.URL objects to enforce domain and path isolation instead of manually constructing headers.**

Always pass a valid `yarl.URL` object to `CookieJar.filter_cookies()` to let `aiohttp` handle domain matching, IDNA normalization, path restrictions, and expiration checks automatically at the trust boundary.

```python
from aiohttp import CookieJar
from yarl import URL

jar = CookieJar()
request_url = URL("https://sub.example.com/path/to/resource")
matched_cookies = jar.filter_cookies(request_url)
```
