# Security cards

Repository: `https://github.com/pyca/cryptography#49.0.0`
Category: authentication

## authentication

### Authenticate passwords and verify credentials securely

**Use when**

Verifying user passwords or credentials using password hashing and verification verifiers.

**Secure rules**

**Rule 1: Authenticate passwords using Argon2id verification methods and handle invalid credentials securely.**

Use `verify_phc_encoded()` or `verify()` to authenticate passwords against encoded Argon2 digests, and catch `cryptography.exceptions.InvalidKey` to detect incorrect credentials or malformed hash strings.

```python
from cryptography.exceptions import InvalidKey
from cryptography.hazmat.primitives.kdf.argon2 import Argon2id

def verify_user_password(password: bytes, encoded_phc: str) -> bool:
    try:
        Argon2id.verify_phc_encoded(password, encoded_phc)
        return True
    except InvalidKey:
        return False
```
