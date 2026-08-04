# Security cards

Repository: `https://github.com/fastapi/fastapi#0.139.2`
Category: interface protocol hardening

## interface protocol hardening

### Include WWW-Authenticate Header on 401 Unauthorized Responses

**Use when**

Handling authentication failures in FastAPI application dependencies returning HTTP 401 Unauthorized responses.

**Secure rules**

**Rule 1: Include the WWW-Authenticate header set to Bearer when raising HTTP 401 Unauthorized exceptions in authentication dependencies.**

When returning an HTTP 401 Unauthorized status in OAuth2 bearer token authentication dependencies, include the `WWW-Authenticate` header set to `Bearer` to maintain compliance with HTTP and OAuth2 standards.

```python
from fastapi import HTTPException, status

raise HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)
```
