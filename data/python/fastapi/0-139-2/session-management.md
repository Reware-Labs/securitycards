# Security cards

Repository: `https://github.com/fastapi/fastapi#0.139.2`
Category: session management

## session management

### Enforce Session Expiration and Lifecycle Validation in FastAPI

**Use when**

Building stateless or stateful session authentication in FastAPI where session identifiers or tokens must be validated for expiration and lifetime constraints.

**Secure rules**

**Rule 1: Explicitly set expiration claims on JWT bearer session tokens**

When issuing JWTs for session authentication, calculate and encode an expiration `exp` claim using `datetime.now(timezone.utc)` combined with a defined `timedelta` duration to prevent indefinite token validity.

```python
from datetime import datetime, timedelta, timezone
import jwt

SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
```

**Rule 2: Require a named cookie credential with `APIKeyCookie`**

Create an `APIKeyCookie` security dependency with the expected cookie name and apply it to protected endpoints. The dependency extracts the cookie value and includes the cookie based API key scheme in the generated OpenAPI documentation. With the default `auto_error=True`, FastAPI rejects requests that do not contain the cookie with an HTTP 401 response.

`APIKeyCookie` verifies that the named cookie is present. Any application specific interpretation or verification of its value is outside the behavior established here.

```python
from fastapi import Depends, FastAPI
from fastapi.security import APIKeyCookie

app = FastAPI()

cookie_scheme = APIKeyCookie(name="session")


@app.get("/items/")
async def read_items(session: str = Depends(cookie_scheme)):
    return {"session": session}
```
