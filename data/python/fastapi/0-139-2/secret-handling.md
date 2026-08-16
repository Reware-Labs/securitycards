# Security cards

Repository: `https://github.com/fastapi/fastapi#0.139.2`
Category: secret handling

## secret handling

### Load Secret Keys Securely from Environment Variables

**Use when**

Configuring secret keys, API tokens, or cryptographic signing material for FastAPI applications.

**Secure rules**

**Rule 1: Keep sensitive application settings in environment variables outside the application code**

Provide sensitive settings, such as secret keys and service credentials, through environment variables that the application reads at runtime. Because environment variables are set outside the code, they do not have to be stored or committed to Git with the application files.

```python
import os

from fastapi import FastAPI

app = FastAPI()
secret_key = os.getenv("SECRET_KEY")


@app.get("/status")
async def status():
    return {"secret_configured": secret_key is not None}
```


### Protect user credentials and stored secrets at rest

**Use when**

Persisting passwords, API tokens, or other secret values submitted by users, in any store.

**Secure rules**

**Rule 1: Store passwords as salted, memory-hard hashes, not plaintext or a fast digest.**

Anyone who reads the database gets every stored value, and a bare `md5`, `sha1`, or `sha256` digest barely helps: those are built to be fast, so a GPU tries billions of candidates per second, and unsalted digests fall to precomputed tables. `PasswordHash.recommended()` from `pwdlib` produces an Argon2id hash with the salt embedded, so no separate column is needed.

```python
from pwdlib import PasswordHash

password_hash = PasswordHash.recommended()

def store_user(conn, email: str, password: str) -> None:
    conn.execute(
        "INSERT INTO users (email, password_hash) VALUES (?, ?)",
        (email, password_hash.hash(password)),   # never the password itself
    )

def check_login(stored_hash: str, supplied: str) -> bool:
    return password_hash.verify(supplied, stored_hash)
```

**Rule 2: Encrypt recoverable secrets before writing them to storage.**

Some values have to be readable again — a stored API key, a token replayed to a third party — so hashing is not an option. Encrypt with an authenticated cipher and store only the ciphertext; `Fernet`, from `cryptography`, adds an HMAC and a fresh IV per message, so tampering is caught on decrypt.

Build the key **once at import**, and never call `Fernet.generate_key()` as a fallback for a missing one: a key minted at runtime differs on each worker and each restart, so everything already stored becomes permanently unreadable — silent data loss that surfaces as an authentication failure. Where no dedicated key is configured, derive one deterministically from the application secret you already have.

```python
import base64
import os
from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from fastapi import FastAPI, HTTPException

app = FastAPI()

def _load_key() -> bytes:
    """One stable key, resolved once at import — never per request."""
    configured = os.environ.get("VAULT_ENCRYPTION_KEY")
    if configured:
        return configured.encode()
    # Derive deterministically from the application secret so the key survives
    # restarts and is identical across workers.
    derived = HKDF(
        algorithm=hashes.SHA256(), length=32, salt=None, info=b"vault-encryption"
    ).derive(os.environ["APP_SECRET"].encode())
    return base64.urlsafe_b64encode(derived)

fernet = Fernet(_load_key())

@app.post("/vault/entries")
def store_entry(conn, owner: str, value: str):
    conn.execute(
        "INSERT INTO vault_entries (owner, ciphertext) VALUES (?, ?)",
        (owner, fernet.encrypt(value.encode())),
    )
    return {"status": "stored"}

@app.get("/vault/entries/{owner}")
def read_entry(conn, owner: str):
    row = conn.execute(
        "SELECT ciphertext FROM vault_entries WHERE owner = ?", (owner,)
    ).fetchone()
    try:
        return {"value": fernet.decrypt(row[0]).decode()}
    except (InvalidToken, TypeError):
        raise HTTPException(status_code=404, detail="Not found")
```

**Rule 3: Keep credential material out of responses, logs, and error details.**

A hash, session token, or reset code that reaches a response body, exception message, or log line has left your control, since logs are aggregated and retained far more widely than the database. Declare a `response_model` that omits the field instead of returning the ORM object, and log an identifier rather than the credential. Pydantic's `SecretStr` renders as `**********` when a model is printed or logged.

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class UserOut(BaseModel):
    id: int
    email: str          # password_hash is deliberately absent

@app.get("/users/{user_id}", response_model=UserOut)
def read_user(user_id: int):
    return load_user_record(user_id)   # extra fields are dropped on serialization
```
