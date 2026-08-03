# Security cards

Repository: `https://github.com/fastapi/fastapi#0.139.2`
Category: authentication

## authentication

### Verify Passwords and Tokens Securely Using Library Verifiers and Constant-Time Comparisons

**Use when**

Verifying user credentials, password hashes, or token signatures during authentication workflows.

**Secure rules**

**Rule 1: Verify passwords against password-hashing verifiers and evaluate dummy password hashes during failed user lookups to prevent timing attacks.**

Always execute password verification even when the user record is missing by verifying against a dummy hash, and verify actual passwords using the library's supported password-hashing verifier.

```python
from pwdlib import PasswordHash

password_hash = PasswordHash.recommended()
DUMMY_HASH = "$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"

def authenticate_user(users_db, username, password):
    user = users_db.get(username)
    if not user:
        password_hash.verify(password, DUMMY_HASH)
        return False
    if not password_hash.verify(password, user.hashed_password):
        return False
    return user
```

**Rule 2: Compare credential strings using constant-time comparison functions to prevent timing side-channel attacks.**

When verifying extracted strings or API keys, encode them to bytes and compare them using `secrets.compare_digest` instead of standard equality operators.

```python
import secrets
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials

app = FastAPI()
security = HTTPBasic()

def authenticate(credentials: HTTPBasicCredentials = Depends(security)):
    current_username_bytes = credentials.username.encode('utf-8')
    correct_username_bytes = b'stanleyjobson'
    is_correct_username = secrets.compare_digest(current_username_bytes, correct_username_bytes)

    current_password_bytes = credentials.password.encode('utf-8')
    correct_password_bytes = b'swordfish'
    is_correct_password = secrets.compare_digest(current_password_bytes, correct_password_bytes)

    if not (is_correct_username and is_correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Incorrect username or password',
            headers={'WWW-Authenticate': 'Basic'},
        )
    return credentials.username
```
