# Security cards

Repository: `https://github.com/fastapi/fastapi#0.139.2`
Category: file handling

## file handling

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
