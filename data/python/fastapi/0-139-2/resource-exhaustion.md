# Security cards

Repository: `https://github.com/fastapi/fastapi#0.139.2`
Category: resource exhaustion

## resource exhaustion

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
