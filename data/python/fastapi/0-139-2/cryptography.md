# Security cards

Repository: `https://github.com/fastapi/fastapi#0.139.2`
Category: cryptography

## cryptography

### Hash user passwords with Argon2 using pwdlib

**Use when**

Implementing user registration and credential verification workflows in FastAPI applications requiring secure password hashing.

**Secure rules**

**Rule 1: Use modern memory-hard hashing algorithms such as Argon2 for storing user passwords.**

Initialize `PasswordHash.recommended()` from the `pwdlib` package to securely hash new user passwords and verify supplied plaintext credentials against stored hashes, preventing offline cracking attacks if data sources are compromised.

```python
from pwdlib import PasswordHash

password_hash = PasswordHash.recommended()

def get_password_hash(password: str) -> str:
    return password_hash.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hash.verify(plain_password, hashed_password)
```
