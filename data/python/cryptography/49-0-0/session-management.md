# Security cards

Repository: `https://github.com/pyca/cryptography#49.0.0`
Category: session management

## session management

### Enforce Session Token Expiration with Fernet Decryption

**Use when**

When validating time-sensitive session state or transient session tokens using Fernet symmetric encryption.

**Secure rules**

**Rule 1: Specify an explicit ttl parameter during token decryption to enforce session expiration.**

Pass an explicit `ttl` parameter in seconds to `Fernet.decrypt()` whenever tokens represent time-sensitive session data. Omitting `ttl` or setting it to `None` causes tokens to remain valid indefinitely as long as the key is recognized, allowing intercepted tokens to be replayed.

```python
from cryptography.fernet import Fernet, InvalidToken

f = Fernet(key)
try:
    data = f.decrypt(token, ttl=300)
except InvalidToken:
    pass
```
