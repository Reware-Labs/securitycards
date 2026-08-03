# Security cards

Repository: `https://github.com/jpadilla/pyjwt#2.13.0`
Category: secret handling

## secret handling

### Ensure non-empty secret keys are loaded for token operations

**Use when**

When loading secret keys and configuring authentication parameters prior to token signing or verification.

**Secure rules**

**Rule 1: Verify that secret keys are populated and non-empty from secure configuration sources before signing or verifying tokens.**

In PyJWT 2.13.0, passing empty string or byte secrets such as `''` or `b''` to HMAC key preparation raises an `InvalidKeyError`. Always ensure that secret keys are loaded correctly from environment variables or managed secret providers and checked before passing them to functions like `jwt.encode()` or `jwt.decode()`.

```python
import os
import jwt

secret_key = os.getenv("JWT_SECRET_KEY")
if not secret_key:
    raise ValueError("JWT_SECRET_KEY must be configured and non-empty")

token = jwt.encode({"sub": "user_123"}, secret_key, algorithm="HS256")
```
