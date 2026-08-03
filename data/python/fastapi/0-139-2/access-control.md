# Security cards

Repository: `https://github.com/fastapi/fastapi#0.139.2`
Category: access control

## access control

### Configure CORSMiddleware with Explicit Origins, Methods, Headers, and Exposure Settings

**Use when**

Use when adding `CORSMiddleware` to a FastAPI application to govern cross-origin browser requests and safely expose custom headers.

**Secure rules**

**Rule 1: Explicitly specify allowed origins, methods, and headers instead of using wildcards when credentials are enabled.**

When configuring `CORSMiddleware` in FastAPI with `allow_credentials=True`, explicitly define allowed origins, methods, and headers rather than using the wildcard `*` to avoid improper validation or broken client authorization flows.

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "https://myapp.com",
    "https://admin.myapp.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)
```

**Rule 2: Explicitly configure custom response headers in CORS settings using the expose_headers parameter.**

When custom response headers such as `X-` headers added by middleware must be accessible to browser clients, explicitly list them in `expose_headers` because browsers hide non-safelisted custom response headers by default.

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://example.com"],
    allow_methods=["GET", "POST"],
    expose_headers=["X-Process-Time"],
)
```


### Enforce Role and Permission Scope Checks in Dependencies

**Use when**

Developing FastAPI routes that require granular permission scopes or ownership validation before performing state modifications or accessing sensitive data.

**Secure rules**

**Rule 1: Verify required permission scopes using Security and SecurityScopes during token validation**

Declare endpoint scope requirements using the `Security` dependency wrapper and inspect required scopes across the dependency tree using a `SecurityScopes` parameter. Compare all scopes in `security_scopes.scopes` against the user's granted scopes to ensure unauthorized tokens are rejected.

```python
async def get_current_user(security_scopes: SecurityScopes, token: Annotated[str, Depends(oauth2_scheme)]):
    token_data = decode_and_validate_token(token)
    for scope in security_scopes.scopes:
        if scope not in token_data.scopes:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not enough permissions",
                headers={"WWW-Authenticate": f'Bearer scope="{security_scopes.scope_str}"'}
            )
    return token_data.user

@app.get("/users/me/items/", dependencies=[Security(get_current_user, scopes=["items"])])
async def read_own_items():
    return [{"item_id": "Foo"}]
```

**Rule 2: Return 403 Forbidden exceptions for unauthorized resource operations**

Raise an `HTTPException` with status code `403` when performing resource ownership or permission checks inside endpoint handlers to reject unauthorized operations securely.

```python
from fastapi import FastAPI, HTTPException, status

app = FastAPI()

@app.put("/items/{item_id}")
def update_item(item_id: str):
    if item_id != "plumbus":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update the item: plumbus"
        )
    return {"item_id": item_id, "name": "The great Plumbus"}
```
