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
