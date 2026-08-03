# Security cards

Repository: `https://github.com/Kludex/starlette#1.3.1`
Category: authentication

## authentication

### Implement Custom Authentication Backends Securely in Starlette

**Use when**

When building custom authentication backends in Starlette to establish and verify user identity from request headers or credentials.

**Secure rules**

**Rule 1: Validate and process credentials within custom authentication backends, returning an appropriate tuple on success or raising an error on failure.**

When creating a custom backend by subclassing `AuthenticationBackend`, ensure the `authenticate()` method returns a tuple of `(AuthCredentials, BaseUser)` upon successful credential verification. Catch credential parsing and decoding exceptions gracefully and raise `AuthenticationError` with a clean description rather than allowing unhandled exceptions to bubble up as 500 server errors.

```python
import base64
import binascii
from starlette.authentication import AuthenticationBackend, AuthenticationError, AuthCredentials, SimpleUser

class CustomBasicAuthBackend(AuthenticationBackend):
    async def authenticate(self, conn):
        if 'Authorization' not in conn.headers:
            return None
        auth = conn.headers['Authorization']
        try:
            scheme, credentials = auth.split()
            if scheme.lower() != 'basic':
                return None
            decoded = base64.b64decode(credentials).decode('ascii')
        except (ValueError, UnicodeDecodeError, binascii.Error):
            raise AuthenticationError('Invalid basic auth credentials')
        username, _, password = decoded.partition(':')
        return AuthCredentials(['authenticated']), SimpleUser(username)
```
