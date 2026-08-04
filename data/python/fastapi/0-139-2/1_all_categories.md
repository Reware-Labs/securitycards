# Security cards

Repository: `https://github.com/fastapi/fastapi#0.139.2`

## Category: access control

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


## Category: api contract misuse

### Define explicit response models instead of excluding fields at runtime

**Use when**

Defining route handlers and specifying response serialization models for API endpoints.

**Secure rules**

**Rule 1: Use dedicated response models instead of runtime exclusion parameters for sensitive fields.**

When returning data from a path operation, define a dedicated Pydantic model for the output type rather than using parameters like `response_model_exclude` or `response_model_include`. This ensures that FastAPI generates accurate OpenAPI documentation that does not expose internal or sensitive attributes that were meant to be hidden.

```python
from pydantic import BaseModel
from fastapi import FastAPI

app = FastAPI()

class ItemBase(BaseModel):
    name: str
    description: str | None = None
    price: float

class ItemOut(ItemBase):
    pass

@app.get("/items/{item_id}", response_model=ItemOut)
async def read_item(item_id: str):
    return {"name": "Foo", "description": "A sample item", "price": 45.0, "tax": 3.2}
```


## Category: authentication

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


## Category: cryptography

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


## Category: file handling

### Mount static files using isolated public asset directories

**Use when**

You are mounting static directories or asset files in a FastAPI application.

**Secure rules**

**Rule 1: Rely on FastAPI's native UploadFile and middleware stack for resource cleanup**

Rely on FastAPI's native `UploadFile` parameters and route handlers where `fastapi_middleware_astack` automatically handles `body.close()` cleanup to avoid unreleased temporary file handles and disk space exhaustion.

```python
from fastapi import FastAPI, File, UploadFile

app = FastAPI()

@app.post("/upload/")
async def handle_upload(file: UploadFile = File(...)):
    contents = await file.read()
    return {"filename": file.filename, "size": len(contents)}
```

**Rule 2: Ensure python-multipart is installed for parsing multipart form and file data**

Ensure that the `python-multipart` library is installed in the application execution environment whenever defining `File` or `UploadFile` parameter types in FastAPI route handlers.

```console
pip install python-multipart
```


### Secure File Uploads with UploadFile and Resource Cleanup

**Use when**

Developing FastAPI endpoints that handle multipart file uploads and need to prevent memory exhaustion and file descriptor leaks.

**Secure rules**

**Rule 1: Use UploadFile instead of raw bytes for handling file uploads.**

Declare file upload parameters using `UploadFile` rather than `bytes` to utilize spooled temporary files that buffer large payloads to disk instead of consuming all application RAM.

```python
from fastapi import FastAPI, UploadFile

app = FastAPI()

@app.post("/upload/")
async def upload_file(file: UploadFile):
    return {"filename": file.filename, "content_type": file.content_type}
```

**Rule 2: Rely on FastAPI's native UploadFile and middleware stack for resource cleanup.**

Rely on FastAPI's native `UploadFile` parameters and route handlers where `fastapi_middleware_astack` automatically handles `body.close()` cleanup to avoid unreleased temporary file handles and disk space exhaustion.

```python
from fastapi import FastAPI, File, UploadFile

app = FastAPI()

@app.post("/upload/")
async def handle_upload(file: UploadFile = File(...)):
    contents = await file.read()
    return {"filename": file.filename, "size": len(contents)}
```

**Rule 3: Ensure python-multipart is installed for parsing multipart form and file data.**

Ensure that the `python-multipart` library is installed in the application execution environment whenever defining `File` or `UploadFile` parameter types in FastAPI route handlers.

```console
pip install python-multipart
```


## Category: input contract definition

### Enforce Strict Schema, Type, and Length Validation for FastAPI Request Parameters and Form Models

**Use when**

Building FastAPI endpoints and validating incoming request parameters, query strings, headers, cookies, and form bodies.

**Secure rules**

**Rule 1: Declare explicit type annotations and Pydantic models for input validation across all parameters**

Use native Python type hints and Pydantic `BaseModel` classes to automatically validate input payloads, verify types, and deserialize request bodies, path parameters, query parameters, headers, cookies, and forms before route handlers execute.

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    name: str
    price: float
    is_offer: bool | None = None

@app.put("/items/{item_id}")
def update_item(item_id: int, item: Item):
    return {"item_name": item.name, "item_id": item_id}
```

**Rule 2: Declare validation constraints for request parameters**

Use `Path()` and `Query()` to declare numeric and string validation constraints for request parameters. Numeric constraints include `gt`, `ge`, `lt`, and `le`.

```python
from typing import Annotated
from fastapi import FastAPI, Path

app = FastAPI()

@app.get("/items/{item_id}")
async def read_item(
    item_id: Annotated[int, Path(gt=0, le=100000)],
):
    return {"item_id": item_id}
```

**Rule 3: Forbid extra input fields in Pydantic models to prevent mass assignment and parameter pollution**

Configure Pydantic models handling form bodies or cookies with `model_config = ConfigDict(extra='forbid')` so that unexpected or unauthorized extra fields trigger an HTTP `422 Unprocessable Entity` response instead of being ignored.

```python
from fastapi import FastAPI, Form
from pydantic import BaseModel, ConfigDict

class UserForm(BaseModel):
    model_config = ConfigDict(extra="forbid")
    username: str
    password: str

app = FastAPI()

@app.post("/login/")
def login(form_data: UserForm = Form()):
    return {"username": form_data.username}
```

**Rule 4: Explicitly specify element types when accepting list query parameters**

Always declare explicit element types such as `list[str]` or `list[int]` instead of using bare `list` to ensure element-level data validation and proper OpenAPI schema definitions.

```python
from typing import Annotated
from fastapi import FastAPI, Query

app = FastAPI()

@app.get("/items/")
async def read_items(q: Annotated[list[str], Query()] = ["foo", "bar"]):
    return {"q": q}
```


## Category: input interpretation safety

### Enforce Strict Content Type Checking for Request Bodies

**Use when**

Developing route handlers and request parsing where input content types and payload formats must be strictly validated.

**Secure rules**

**Rule 1: Keep strict_content_type enabled when configuring route handlers and request parsing.**

Ensure `strict_content_type` is kept enabled or explicitly set to `True` to prevent FastAPI from attempting to parse JSON bodies when the `Content-Type` header is missing or non-JSON, thereby avoiding content-type confusion and unintentional request interpretation.

```python
from fastapi import APIRouter, FastAPI
from pydantic import BaseModel

app = FastAPI()
router = APIRouter()

class ItemPayload(BaseModel):
    name: str

@router.post("/items/")
async def create_item(payload: ItemPayload):
    return {"status": "ok", "name": payload.name}

app.include_router(router)
```


## Category: interface protocol hardening

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


## Category: output encoding

### Sanitize JSON embedded in HTML script tags

**Use when**

Customizing interactive API documentation pages that render configuration dictionaries or parameters inside HTML script tags.

**Secure rules**

**Rule 1: Escape JSON values embedded in HTML script tags against script execution.**

When customizing Swagger UI settings, pass parameters directly through `swagger_ui_parameters` in `get_swagger_ui_html()` so that values are safely converted using the internal HTML-safe JSON encoder.

```python
from fastapi import FastAPI
from fastapi.openapi.docs import get_swagger_ui_html

app = FastAPI(docs_url=None)

@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=app.title + " - Swagger UI",
        swagger_ui_parameters={"deepLinking": True, "persistAuthorization": True}
    )
```


## Category: resource exhaustion

### Enforce Request Body Size Limits to Prevent Memory Exhaustion

**Use when**

Building FastAPI endpoints that accept request payloads and data bodies which might be leveraged by adversaries for denial of service via unbounded memory consumption.

**Secure rules**

**Rule 1: Enforce request body size limits with ASGI middleware that counts received body bytes before path operations run**

For endpoints that require a request size limit, register custom ASGI middleware that wraps the request’s `receive` callable, accumulates the bytes contained in each `http.request` message, and rejects the request when the configured maximum is exceeded. Counting received body chunks enforces the limit on the body actually delivered to the application rather than relying only on a request header.

```python
from fastapi import FastAPI, File, HTTPException, UploadFile
from starlette.types import ASGIApp, Receive, Scope, Send


class ContentSizeLimitMiddleware:
    def __init__(
        self,
        app: ASGIApp,
        max_content_size: int | None = None,
    ) -> None:
        self.app = app
        self.max_content_size = max_content_size

    def receive_wrapper(self, receive: Receive) -> Receive:
        received = 0

        async def inner():
            nonlocal received

            message = await receive()
            if message["type"] != "http.request":
                return message

            received += len(message.get("body", b""))

            if (
                self.max_content_size is not None
                and received > self.max_content_size
            ):
                raise HTTPException(
                    status_code=422,
                    detail={
                        "name": "ContentSizeLimitExceeded",
                        "message": "Request body size limit exceeded",
                    },
                )

            return message

        return inner

    async def __call__(
        self,
        scope: Scope,
        receive: Receive,
        send: Send,
    ) -> None:
        if scope["type"] != "http" or self.max_content_size is None:
            await self.app(scope, receive, send)
            return

        await self.app(scope, self.receive_wrapper(receive), send)


app = FastAPI()
app.add_middleware(
    ContentSizeLimitMiddleware,
    max_content_size=2 * 1024 * 1024,
)


@app.post("/upload")
def upload(file: UploadFile = File(...)):
    return {"filename": file.filename}
```


### Enforce Upper Limits on Pagination Parameters

**Use when**

Building FastAPI route endpoints that query databases using offset and limit parameters.

**Secure rules**

**Rule 1: Use Query parameter validation constraints to enforce maximum limits on pagination query parameters.**

Prevent excessive database resource consumption and denial of service by bounding query parameters like `limit` using FastAPI's `Query` parameter helper with `le` constraints.

```python
from fastapi import FastAPI, Query
from sqlmodel import Session, select

app = FastAPI()

@app.get("/heroes/")
def read_heroes(
    session: Session,
    offset: int = 0,
    limit: int = Query(default=100, le=100),
):
    heroes = session.exec(select(Hero).offset(offset).limit(limit)).all()
    return heroes
```


## Category: runtime environment hardening

### Disable Debug Mode and Use Production Run Commands in Production

**Use when**

Configuring the production runtime environment for deployment to disable verbose error exposure and development-specific server settings.

**Secure rules**

**Rule 1: Explicitly disable debug mode in production to prevent leaking internal tracebacks and configuration details.**

Ensure the `debug` parameter is explicitly set to `False` when instantiating `FastAPI` in production configurations so internal exception tracebacks are not rendered and returned directly in HTTP server error responses.

```python
import os
from fastapi import FastAPI

app = FastAPI(debug=False)
```

**Rule 2: Use the production run command instead of the development server mode when deploying the application.**

Use the `fastapi run` command for production deployments instead of `fastapi dev` to avoid enabling auto-reloading via file system watchers and development server configurations.

```bash
fastapi run main.py
```


## Category: secret handling

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


## Category: security control integrity

### Order Middleware Correctly to Preserve Security Control Execution

**Use when**

Configuring security, logging, or rate-limiting middleware in a FastAPI application using `app.add_middleware()` or `@app.middleware()`.

**Secure rules**

**Rule 1: Account for middleware stacking order when adding security and processing layers.**

Register middleware so that outermost security controls such as rate limiters, logging, or CORS are added last. This ensures they wrap inner middleware layers and execute first on incoming requests.

```python
from fastapi import FastAPI, Request

app = FastAPI()

@app.middleware("http")
async def inner_security_audit(request: Request, call_next):
    response = await call_next(request)
    return response

@app.middleware("http")
async def outer_boundary_check(request: Request, call_next):
    response = await call_next(request)
    return response
```


## Category: session management

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
