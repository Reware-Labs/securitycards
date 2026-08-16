# Security cards

Repository: `https://github.com/fastapi/fastapi#0.139.2`
Category: file handling

## file handling

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
