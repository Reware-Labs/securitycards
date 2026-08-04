# Security cards

Repository: `https://github.com/urllib3/urllib3#2.7.0`
Category: session management

## session management

### Extract and manage session cookies securely using CookieJar

**Use when**

Handling session cookies returned in urllib3 HTTP responses to ensure security attributes like HttpOnly and path restrictions are properly interpreted.

**Secure rules**

**Rule 1: Pass the HTTPResponse object directly to CookieJar for standard library cookie extraction.**

When handling session cookies in `urllib3`, pass the `HTTPResponse` object directly to `http.cookiejar.CookieJar.extract_cookies()` along with the corresponding request object. This ensures correct interpretation of security attributes like `HttpOnly`, `expires`, and `path` restrictions, avoiding manual parsing errors that can compromise session security.

```python
import http.cookiejar
import urllib.request
from urllib3.response import HTTPResponse

req = urllib.request.Request("https://example.com")
jar = http.cookiejar.CookieJar()
# response is a urllib3.response.HTTPResponse instance
jar.extract_cookies(response, req)
```
