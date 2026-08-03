# Security cards

Repository: `https://github.com/jpadilla/pyjwt#2.13.0`
Category: security control integrity

## security control integrity

### Handle Token Validation Failures and Maintain Fail-Closed Error Boundaries

**Use when**

Decoding and verifying JSON Web Tokens where validation errors must result in explicit authentication rejections rather than unhandled exceptions or bypassed controls.

**Secure rules**

**Rule 1: Wrap token decoding calls in try-except blocks catching PyJWT exception subclasses to ensure validation errors fail closed.**

Always wrap `jwt.decode()` calls in try-except blocks that catch `jwt.InvalidTokenError` or its specific subclasses such as `jwt.ExpiredSignatureError`. This ensures token validation failures are properly handled and requests are explicitly rejected.

```python
import jwt

try:
    payload = jwt.decode(token, key, algorithms=["HS256"])
except jwt.ExpiredSignatureError:
    raise UnauthorizedError("Token has expired")
except jwt.InvalidTokenError:
    raise UnauthorizedError("Invalid token")
```
