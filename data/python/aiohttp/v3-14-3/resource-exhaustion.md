# Security cards

Repository: `https://github.com/aio-libs/aiohttp#v3.14.3`
Category: resource exhaustion

## resource exhaustion

### Configure client connection, header, and timeout limits to prevent resource exhaustion

**Use when**

Developing asynchronous HTTP clients with `aiohttp` to ensure remote endpoints and excessive inputs do not consume unbounded local resources.

**Secure rules**

**Rule 1: Enforce strict size bounds on HTTP response headers and line sizes during client session initialization.**

Specify bounded limits for `max_line_size`, `max_field_size`, and `max_headers` when creating an `aiohttp.ClientSession` to protect against excessive memory consumption caused by malicious or malformed remote servers.

```python
import aiohttp

async with aiohttp.ClientSession(
    max_line_size=8190,
    max_field_size=8190,
    max_headers=128
) as session:
    async with session.get("https://example.com") as resp:
        text = await resp.text()
```

**Rule 2: Set explicit TCP connection pool limits instead of using zero or unlimited settings.**

Configure explicit values for `limit` and `limit_per_host` on `aiohttp.TCPConnector` rather than disabling limits with zero, preventing local file descriptor and memory exhaustion under heavy concurrent client traffic.

```python
import aiohttp

connector = aiohttp.TCPConnector(limit=100, limit_per_host=30)
async with aiohttp.ClientSession(connector=connector) as session:
    async with session.get("https://example.com") as resp:
        pass
```

**Rule 3: Define explicit operation timeout limits to prevent hanging connections.**

Use `aiohttp.ClientTimeout` to establish upper time bounds for request operations such as `total`, `connect`, and `sock_read`, avoiding default timeouts that allow unresponsive servers to hold connection sockets open indefinitely.

```python
timeout = aiohttp.ClientTimeout(total=10, connect=3, sock_read=5)
async with aiohttp.ClientSession(timeout=timeout) as session:
    async with session.get('https://api.example.com/data') as response:
        data = await response.json()
```

**Rule 4: Stream large response payloads instead of reading them completely into memory.**

Avoid loading entire response bodies into RAM with methods like `resp.read()` or `resp.text()` when downloading large files; instead, stream the response content using `resp.content.iter_chunked()`.

```python
with open(filename, 'wb') as fd:
    async for chunk in resp.content.iter_chunked(chunk_size):
        fd.write(chunk)
```

**Rule 5: Ensure client response instances are fully closed or released.**

Manage response lifetimes using asynchronous context managers (`async with`) to guarantee that underlying network connections are properly returned to the connection pool.

```python
async with session.get("https://example.com/api") as response:
    data = await response.json()
```


### Enforce server request size limits and stream multipart uploads to prevent denial of service

**Use when**

Developing asynchronous HTTP servers with `aiohttp.web` to handle large incoming payloads and file uploads safely without exhausting memory or storage.

**Secure rules**

**Rule 1: Configure a strict application-level maximum request payload size.**

Set `client_max_size` on `web.Application` to reject excessively large incoming HTTP request bodies and multipart uploads automatically with a `413 Payload Too Large` error.

```python
app = web.Application(client_max_size=1024 * 1024)

async def upload_handler(request: web.Request) -> web.Response:
    reader = await request.multipart()
    part = await reader.next()
    data = await part.text()
    return web.Response(text="Uploaded")

app.router.add_post("/upload", upload_handler)
```

**Rule 2: Stream multipart file uploads chunk by chunk instead of buffering in memory.**

Do not use `await request.post()` for large file uploads because it reads the entire payload into memory. Instead, process multipart requests via `await request.multipart()` and read data iteratively using `await field.read_chunk()`.

```python
async def store_mp3_handler(request):
    reader = await request.multipart()
    while True:
        part = await reader.next()
        if part is None:
            break
        if part.name == 'mp3':
            with open('/spool/yarrr-media/mp3/file.mp3', 'wb') as f:
                while True:
                    chunk = await part.read_chunk()
                    if not chunk:
                        break
                    f.write(chunk)
    return web.Response(text='File uploaded safely')
```
