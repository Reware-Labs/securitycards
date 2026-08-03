# Security cards

Repository: `https://github.com/psf/requests#v2.34.2`
Category: authentication

## authentication

### Authenticate Requests Securely Using Supported Mechanisms

**Use when**

Establishing and verifying identity using credentials, tokens, or digest authentication when sending HTTP requests.

**Secure rules**

**Rule 1: Implement custom authentication mechanisms by subclassing AuthBase**

When standard HTTP Basic or Digest authentication is insufficient, implement custom authentication logic by subclassing `requests.auth.AuthBase` and modifying the `Request` object inside `__call__` to encapsulate header injection and token signing safely.

```python
import requests
from requests.auth import AuthBase

class CustomBearerTokenAuth(AuthBase):
    def __init__(self, token):
        self.token = token

    def __call__(self, r):
        r.headers['Authorization'] = f'Bearer {self.token}'
        return r

response = requests.get('https://httpbin.org/get', auth=CustomBearerTokenAuth('secret-token'))
```

**Rule 2: Disable automatic redirects when Digest credentials must not be forwarded**

Use `HTTPDigestAuth` when a server requires HTTP Digest authentication, but do not assume it removes credentials from every redirect. Its 401 handler limits authenticated resends, while its redirect hook only resets that retry state. Authorization stripping is handled separately and conditionally, so some same-host redirects retain the header. When no redirected request may carry the credentials, set `allow_redirects=False`.

```python
import requests
from requests.auth import HTTPDigestAuth

response = requests.get(
    "https://httpbin.org/digest-auth/auth/user/pass",
    auth=HTTPDigestAuth("user", "pass"),
    allow_redirects=False,
)
```
