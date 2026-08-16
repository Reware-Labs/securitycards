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


### Take the acting identity from the verified credential

**Use when**

A route reads or modifies data belonging to a specific user and the request also carries a username, account id, or email.

**Secure rules**

**Rule 1: Resolve the subject from the authentication dependency, not the payload.**

An identifier in the request says who the caller *claims* to be; only the verified token says who they are. Reading `owner` from the body lets any authenticated caller reach anyone else's data by editing one field. Key the lookup on the dependency's value, and where the contract carries the identifier too, compare and reject with `403`.

```python
from typing import Annotated
from fastapi import Depends, FastAPI, HTTPException, status
from pydantic import BaseModel

app = FastAPI()

class NotePayload(BaseModel):
    owner: str
    body: str

@app.post("/notes")
def create_note(
    payload: NotePayload,
    current_user: Annotated[str, Depends(get_current_user)],
):
    if payload.owner != current_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot act on behalf of another user",
        )
    save_note(current_user, payload.body)   # keyed by the verified identity
    return {"status": "created"}
```

**Rule 2: Apply the ownership check on read paths as well as writes.**

Authorization declared handler by handler is only as complete as the last route somebody added, and a `GET` filtered by a query parameter is as exploitable as an unguarded `PUT`. Scope the query by the authenticated subject so an unowned row is never loaded, and prefer `404` over `403` where existence is sensitive. `APIRouter(dependencies=[...])` declares it once.

```python
from typing import Annotated
from fastapi import APIRouter, Depends, FastAPI, HTTPException

app = FastAPI()
router = APIRouter(dependencies=[Depends(get_current_user)])

@router.get("/notes")
def list_notes(current_user: Annotated[str, Depends(get_current_user)]):
    records = load_notes(owner=current_user)   # scoped, not filtered afterwards
    if not records:
        raise HTTPException(status_code=404, detail="Not found")
    return {"notes": records}

app.include_router(router)
```
