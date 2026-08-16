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


## Category: dangerous execution

### Evaluate request-supplied expressions with a restricted parser

**Use when**

A route accepts a formula, filter, rule, or other expression as text and computes a result from it.

**Secure rules**

**Rule 1: Do not pass request data to `eval`, `exec`, or `compile`.**

These give the caller the full language, and restricting `globals` or `__builtins__` does not contain it — such namespaces are routinely escaped through attribute chains on ordinary objects. Parse the text with `ast.parse(mode="eval")`, walk the tree, and reject any node type outside an explicit allowlist before computing the result yourself. `ast.literal_eval` is not a substitute: it accepts only literals and `+`/`-` on numeric constants.

```python
import ast
import operator
from fastapi import FastAPI, HTTPException

app = FastAPI()

_OPS = {
    ast.Add: operator.add, ast.Sub: operator.sub,
    ast.Mult: operator.mul, ast.Div: operator.truediv,
    ast.USub: operator.neg,
}

def _evaluate(node: ast.AST) -> float:
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
        return node.value
    if isinstance(node, ast.BinOp) and type(node.op) in _OPS:
        return _OPS[type(node.op)](_evaluate(node.left), _evaluate(node.right))
    if isinstance(node, ast.UnaryOp) and type(node.op) in _OPS:
        return _OPS[type(node.op)](_evaluate(node.operand))
    raise ValueError("unsupported expression")

@app.post("/formulas/evaluate")
def evaluate_formula(expression: str):
    try:
        return {"result": _evaluate(ast.parse(expression, mode="eval").body)}
    except ZeroDivisionError:
        raise HTTPException(status_code=422, detail="Division by zero")
    except (ValueError, SyntaxError, TypeError, RecursionError):
        raise HTTPException(status_code=422, detail="Invalid expression")
```

**Rule 2: Do not let request data choose code to import or attributes to resolve.**

Passing a request value to `importlib.import_module`, `__import__`, `getattr`, or `pickle.loads` reaches modules and functions the route never meant to expose, and import side effects run at load time. Resolve the target through a dictionary of handlers defined in code, keyed by a `Literal` or `Enum` so unknown values fail validation first.

```python
from enum import Enum
from fastapi import FastAPI

app = FastAPI()

class Report(str, Enum):
    sales = "sales"
    inventory = "inventory"

def _sales_report() -> dict: return {"report": "sales"}
def _inventory_report() -> dict: return {"report": "inventory"}

HANDLERS = {Report.sales: _sales_report, Report.inventory: _inventory_report}

@app.get("/reports/{name}")
def run_report(name: Report):
    return HANDLERS[name]()
```


## Category: file handling

### Secure File Uploads with UploadFile and Resource Cleanup

**Use when**

Developing FastAPI endpoints that handle multipart file uploads and need to prevent memory exhaustion and file descriptor leaks.

**Secure rules**

**Rule 1: Use UploadFile instead of raw bytes for handling file uploads.**

Declare file upload parameters using `UploadFile` rather than `bytes` to utilize spooled temporary files that buffer large payloads to disk instead of consuming all application RAM. Use `UploadFile` only for parts that are actually uploaded files; a multipart field carrying text belongs in `Form()` with its own type, and declaring it as `UploadFile` makes FastAPI reject every request that sends it as a string.

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


### Confine request-influenced paths to a fixed base directory

**Use when**

Opening, writing, serving, or deleting a file whose name or path comes from a request parameter, body field, or upload.

**Secure rules**

**Rule 1: Resolve the path and confirm it stays inside the base directory.**

Joining a base directory with a request value does not confine the result: `os.path.join` and `Path.__truediv__` both discard the base when the second operand is absolute, and `../` segments walk out of it. Build the full path, call `.resolve()` to collapse symlinks and `..`, then check it against the resolved base with `is_relative_to`. Check rather than strip — removing `../` once turns `....//` into `../`.

```python
from pathlib import Path
from fastapi import FastAPI, HTTPException

app = FastAPI()
BASE_DIR = Path("/app/storage").resolve()

def resolve_within_base(name: str) -> Path:
    candidate = (BASE_DIR / name).resolve()
    if not candidate.is_relative_to(BASE_DIR):
        raise HTTPException(status_code=400, detail="Invalid path")
    return candidate

@app.get("/files/{name}")
def read_file(name: str):
    return {"content": resolve_within_base(name).read_text()}
```

**Rule 2: Store uploads under a server-generated name, not the client's filename.**

`UploadFile.filename` is attacker-controlled and may hold `../`, an absolute path, a Windows-style `..\`, a leading `-`, or a name that collides with an existing file. Generate the stored name yourself — a UUID or a database key — and keep the original only as a display label. Where it must be reused, reduce it with `Path(name).name` and reject `""`, `"."`, and `".."`.

```python
import shutil
import uuid
from pathlib import Path
from fastapi import FastAPI, UploadFile

app = FastAPI()
UPLOAD_DIR = Path("/app/uploads").resolve()

@app.post("/upload")
def upload(file: UploadFile):
    stored_name = uuid.uuid4().hex
    destination = UPLOAD_DIR / stored_name
    with destination.open("wb") as out:
        shutil.copyfileobj(file.file, out)
    return {"id": stored_name, "original_name": file.filename}
```

**Rule 3: Confirm each archive member resolves inside the extraction directory.**

Archive entries carry their own paths, so an untrusted member named `../../etc/cron.d/job` writes exactly there when extracted with `tarfile`. Resolve each destination against the extraction root and skip anything that escapes it or is not a regular file. `ZipFile.extract` and `extractall` already sanitize member paths; `tarfile.extractall` needs `filter="data"`, available from Python 3.12 and the default from 3.14.

```python
import zipfile
from pathlib import Path
from fastapi import FastAPI, HTTPException

app = FastAPI()

def extract_safely(archive_path: Path, target_dir: Path) -> list[str]:
    target = target_dir.resolve()
    written: list[str] = []
    with zipfile.ZipFile(archive_path) as archive:
        for member in archive.infolist():
            if member.is_dir():
                continue
            destination = (target / member.filename).resolve()
            if not destination.is_relative_to(target):
                raise HTTPException(status_code=400, detail="Unsafe archive entry")
            destination.parent.mkdir(parents=True, exist_ok=True)
            with archive.open(member) as src, destination.open("wb") as out:
                out.write(src.read())
            written.append(member.filename)
    return written
```


## Category: injection

### Bind untrusted values into SQL statements as parameters

**Use when**

Building a SQL query where any part of the statement comes from a path parameter, query parameter, header, or request body.

**Secure rules**

**Rule 1: Pass request values as bound parameters, never as SQL text.**

Pydantic validates a field's type, but a validated `str` is still arbitrary text. Concatenating or formatting it into the statement lets a value such as `admin'--` change what the query means. Use `?` with `sqlite3`, `%s` with `psycopg`, or `:name` with SQLAlchemy `text()`. Placeholders bind values only — not table or column names.

```python
import sqlite3
from fastapi import FastAPI

app = FastAPI()

@app.get("/users/{email}")
def get_user(email: str):
    with sqlite3.connect("app.db") as conn:
        row = conn.execute(
            "SELECT id, username FROM users WHERE email = ?", (email,)
        ).fetchone()
    return {"id": row[0], "username": row[1]} if row else {}
```

**Rule 2: Map identifiers through an allowlist when a placeholder cannot be used.**

Table names, column names, and sort directions are part of the statement's syntax, so drivers will not bind them. Translate the request value through a dictionary or `Literal` defined in code and interpolate the result, which never contains caller-controlled text. Escaping the raw value instead is fragile and varies by database.

```python
from typing import Literal
import sqlite3
from fastapi import FastAPI

app = FastAPI()

SORT_COLUMNS = {"name": "name", "created": "created_at"}

@app.get("/products")
def list_products(sort_by: Literal["name", "created"] = "name"):
    column = SORT_COLUMNS[sort_by]   # a constant from our own code
    with sqlite3.connect("app.db") as conn:
        rows = conn.execute(
            f"SELECT id, name FROM products ORDER BY {column} LIMIT ?", (100,)
        ).fetchall()
    return [{"id": r[0], "name": r[1]} for r in rows]
```


### Invoke external programs as argument lists without a shell

**Use when**

Running an external tool where any argument is derived from request data, such as a filename, URL, or hostname.

**Secure rules**

**Rule 1: Run programs as an argument list rather than a shell string.**

`shell=True`, `os.system`, and `os.popen` hand the string to `/bin/sh`, which interprets `;`, `|`, backticks, and `$(...)`, so a filename such as `report.pdf; rm -rf /var/data` runs a second command. A list keeps every element a single argument because `subprocess` calls `execve` directly. `shell=False` is already the default — the risk is overriding it or assembling one long command string.

```python
import subprocess
from fastapi import FastAPI, HTTPException

app = FastAPI()

@app.post("/convert")
def convert(source: str, target: str):
    result = subprocess.run(
        ["convert", source, target],   # a list, not a command string
        capture_output=True,
        timeout=30,
    )
    if result.returncode != 0:
        raise HTTPException(status_code=422, detail="Conversion failed")
    return {"output": target}
```

**Rule 2: Stop request-derived arguments from being read as options.**

Without a shell there is still the program's own flag parser: an argument beginning with `-` becomes an option and can redirect output or enable an unintended mode. Rejecting leading dashes is the guard that always works, so make that the check you rely on. `--` is a widely followed convention rather than a guaranteed one: `getopt`-based tools honour it, but `g++` and `gcc` reject it outright with `unrecognized command-line option '--'`, so adding it to a compiler invocation breaks a command that was working. Pass `--` only to a program documented to accept it, and keep your own flags ahead of it, since many tools are order-sensitive.

```python
import subprocess
from fastapi import FastAPI, HTTPException

app = FastAPI()

@app.post("/reachability")
def check(host: str):
    if host.startswith("-"):
        raise HTTPException(status_code=422, detail="Invalid host")
    result = subprocess.run(
        ["ping", "-c", "1", "--", host],  # our flags first, then user data
        capture_output=True,
        timeout=10,
    )
    return {"reachable": result.returncode == 0}
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

**Rule 3: Reject extra input fields only where they would be bound to stored or privileged state**

`model_config = ConfigDict(extra='forbid')` stops mass assignment — a caller smuggling an unexpected field such as `role` or `is_admin` into a model whose values are written to a record. Apply it to create and update bodies that map onto persisted objects. Do not apply it to inputs you only read known fields from, such as login credentials or lookup requests: a client may send a documented superset of fields (often the same object it received earlier), and forbidding extras turns a valid request into a `422`. There, read the fields you need and let the rest be ignored.

```python
from fastapi import FastAPI
from pydantic import BaseModel, ConfigDict

# Mass-assignment sink: these values are written to the user's record, so an
# unexpected field must be rejected rather than silently bound.
class ProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    display_name: str
    bio: str

app = FastAPI()

@app.put("/users/{user_id}/profile")
def update_profile(user_id: int, update: ProfileUpdate):
    save_profile(user_id, update.display_name, update.bio)
    return {"status": "updated"}
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


### Encode untrusted data for the context the response places it in

**Use when**

Returning text, markup, or stored content that originated from a request, or writing request data into application logs.

**Secure rules**

**Rule 1: Serve stored user content with a non-executable media type.**

`HTMLResponse` and `Response(media_type="text/html")` tell the browser to parse the body as markup, so stored `<script>` runs under your origin the next time somebody views it. Returning the same bytes as JSON or `text/plain` renders them as text. Add `X-Content-Type-Options: nosniff` so the browser does not sniff the body into a richer type, and `Content-Disposition: attachment` where a download is intended.

```python
from fastapi import FastAPI, Response

app = FastAPI()

@app.get("/pages/{slug}")
def read_page(slug: str):
    body = load_submitted_page(slug)   # user-supplied, untrusted
    return Response(
        content=body,
        media_type="text/plain; charset=utf-8",
        headers={"X-Content-Type-Options": "nosniff"},
    )
```

**Rule 2: Escape untrusted values when the response has to be HTML.**

Render markup with `Jinja2Templates`, which autoescapes interpolated values for the HTML context, or call `html.escape(value, quote=True)` on each untrusted value in a hand-built fragment. This covers text and quoted-attribute positions; values landing inside a `<script>` block or a `href`/`src` URL need JSON or URL encoding instead. `markupsafe.Markup` turns escaping off, so keep request data out of it.

```python
import html
from fastapi import FastAPI
from fastapi.responses import HTMLResponse

app = FastAPI()

@app.get("/greet", response_class=HTMLResponse)
def greet(name: str):
    return f"<p>Hello, {html.escape(name, quote=True)}</p>"
```

**Rule 3: Sanitize user-authored markup when the response must be `text/html`.**

An endpoint documented as returning `text/html` has to return it, so Rule 1 does not apply — a security rule hardens a specification rather than amending it. Rule 2 escapes values you interpolate into markup you control, not a whole page a user wrote. Run the stored markup through an allowlist sanitizer: `nh3` keeps the formatting tags the feature needs and drops `<script>`, `onload`-style handler attributes, and `javascript:` URLs. Where no sanitizer is available, `html.escape` makes the page inert at the cost of showing its tags as text.

A sanitizer may legitimately remove everything. Distinguish a missing record with `page is None`; do not treat an empty sanitized string as though the record does not exist.

```python
import nh3
from fastapi import FastAPI, HTTPException, Response

app = FastAPI()

@app.get("/pages/{slug}")
def read_page(slug: str):
    page = load_submitted_page(slug)   # user-authored markup
    if page is None:
        raise HTTPException(status_code=404, detail="Not found")
    return Response(
        content=nh3.clean(page),       # keeps safe tags, drops scripts and handlers
        media_type="text/html; charset=utf-8",
        headers={"X-Content-Type-Options": "nosniff"},
    )
```

**Rule 4: Strip newline and control characters before writing request data to a log.**

A value containing `\n` or `\r` splits one log entry into two, letting a caller forge lines that look like the server wrote them and pushing real events out of view. Replace line breaks and other control characters before logging, cap the length, and prefer parameterized logging calls so the value stays a distinct field.

```python
import logging
from fastapi import FastAPI

app = FastAPI()
logger = logging.getLogger("app")

def sanitize_for_log(value: str, limit: int = 200) -> str:
    cleaned = "".join(ch if ch.isprintable() else " " for ch in value)
    return cleaned[:limit]

@app.post("/events")
def record_event(message: str):
    logger.info("client event: %s", sanitize_for_log(message))
    return {"status": "recorded"}
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


### Bound work whose cost the caller controls

**Use when**

Running pattern matching, spawning an external process, decompressing an archive, or producing a response whose size depends on request data.

**Secure rules**

**Rule 1: Keep request-supplied patterns out of `re`, and cap the text they match against.**

Python's `re` engine backtracks, so a pattern such as `(a+)+` against a non-matching subject takes time exponential in its length, and since the ASGI event loop is shared, one such request stalls every other on the process. Match against patterns defined in code, treat a caller-supplied needle as a literal with `re.escape`, and bound the subject length.

```python
import re
from fastapi import FastAPI, HTTPException

app = FastAPI()
MAX_SUBJECT = 100_000

@app.get("/search")
def search(needle: str, haystack: str):
    if len(haystack) > MAX_SUBJECT:
        raise HTTPException(status_code=413, detail="Content too large")
    # The caller supplies text to find, not a pattern to compile.
    matches = [m.start() for m in re.finditer(re.escape(needle), haystack)]
    return {"positions": matches[:100]}
```

**Rule 2: Give every external process a timeout.**

`subprocess.run` waits indefinitely by default, so an input that makes a converter or decoder loop holds the worker and its file descriptors for as long as the tool runs. Pass `timeout`, catch `subprocess.TimeoutExpired`, and reject the request — `subprocess.run` kills the child before re-raising, leaving no orphan. Capturing output with a size check also stops a tool that streams back unbounded data.

```python
import subprocess
from fastapi import FastAPI, HTTPException

app = FastAPI()

@app.post("/thumbnails")
def thumbnail(source: str, target: str):
    try:
        subprocess.run(
            ["convert", source, "-resize", "128x128", target],
            capture_output=True,
            timeout=15,
            check=True,
        )
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Conversion timed out")
    except subprocess.CalledProcessError:
        raise HTTPException(status_code=422, detail="Conversion failed")
    return {"output": target}
```

**Rule 3: Limit how many bytes an archive may expand to.**

Compression ratios above 1000:1 are easy to construct, so a few kilobytes of upload can expand into gigabytes and exhaust memory or disk. Read each member in bounded chunks and stop once a running total is exceeded, which enforces the limit on the bytes actually produced. `ZipInfo.file_size` is a useful pre-check but is read from the archive itself and can be falsified.

```python
import zipfile
from fastapi import FastAPI, HTTPException

app = FastAPI()
MAX_TOTAL_BYTES = 50 * 1024 * 1024
CHUNK = 64 * 1024

def read_bounded(archive_path: str) -> bytes:
    written = 0
    output = bytearray()
    with zipfile.ZipFile(archive_path) as archive:
        for member in archive.infolist():
            if member.is_dir():
                continue
            with archive.open(member) as src:
                while chunk := src.read(CHUNK):
                    written += len(chunk)
                    if written > MAX_TOTAL_BYTES:
                        raise HTTPException(status_code=413, detail="Archive too large")
                    output.extend(chunk)
    return bytes(output)
```

**Rule 4: Keep a handler failure from taking the worker down with it.**

Starlette's error middleware turns an unhandled exception in a path operation into a 500, but code outside that boundary — a background thread or a lifespan task — can end the process and drop every in-flight request. Catch the failures the operation can produce, such as `ZeroDivisionError` and decoding errors, and answer with a 4xx.

```python
from fastapi import FastAPI, HTTPException

app = FastAPI()

@app.post("/divide")
def divide(numerator: float, denominator: float):
    try:
        return {"result": numerator / denominator}
    except ZeroDivisionError:
        raise HTTPException(status_code=422, detail="Division by zero")
    except OverflowError:
        raise HTTPException(status_code=422, detail="Result out of range")
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
