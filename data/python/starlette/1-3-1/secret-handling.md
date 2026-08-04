# Security cards

Repository: `https://github.com/Kludex/starlette#1.3.1`
Category: secret handling

## secret handling

### Protect sensitive credentials using Starlette Secret datastructures

**Use when**

When loading session keys, application secrets, or sensitive configuration values into Starlette middleware or components.

**Secure rules**

**Rule 1: Load sensitive credentials and keys into Starlette Secret datastructures from secure configuration sources or environment variables.**

Pass session secret keys as `Secret` objects loaded from environment variables rather than hardcoding plaintext strings into source code. Store secret keys and sensitive credentials in environment variables or non-committed `.env` files, and read sensitive values using Starlette's `Secret` datastructure. Explicitly cast `Secret` instances to `str` only at the exact point of usage to prevent unintentional string representation leakage during logging, introspection, or error reporting.

```python
import os
from starlette.datastructures import Secret
from starlette.middleware.sessions import SessionMiddleware

secret_key = Secret(os.environ.get("SESSION_SECRET_KEY", ""))
middleware = SessionMiddleware(app, secret_key=secret_key)
```
