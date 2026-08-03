# Security cards

Repository: `https://github.com/psf/requests#v2.34.2`
Category: session management

## session management

### Configure Secure and Domain-Restricted Session Cookies

**Use when**

Creating custom cookies programmatically or adding them to a RequestsCookieJar for session management.

**Secure rules**

**Rule 1: Explicitly define the domain, path, and secure flag when creating session cookies.**

When creating cookies programmatically via `requests.cookies.create_cookie()` or adding them to a `RequestsCookieJar`, you must explicitly specify the `domain`, `path`, and set `secure=True`. Omitting the domain defaults to an empty string, turning the cookie into a supercookie that attaches to requests across all external domains. Leaving `secure=False` permits session cookies to be transmitted over unencrypted HTTP connections.

```python
from requests.cookies import create_cookie, RequestsCookieJar

jar = RequestsCookieJar()
cookie = create_cookie(
    name="session_id",
    value="secret_token_val",
    domain="api.example.com",
    path="/",
    secure=True
)
jar.set_cookie(cookie)
```
