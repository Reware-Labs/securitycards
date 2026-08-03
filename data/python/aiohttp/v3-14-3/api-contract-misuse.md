# Security cards

Repository: `https://github.com/aio-libs/aiohttp#v3.14.3`
Category: api contract misuse

## api contract misuse

### Avoid parallel receive calls on a single WebSocket object

**Use when**

Developing asynchronous network applications or web services using aiohttp Web-Sockets where multiple tasks might interact with a single WebSocket stream.

**Secure rules**

**Rule 1: Ensure that only a single asyncio task handles incoming receive calls or iteration over a web.WebSocketResponse.**

Do not invoke receive concurrently from multiple tasks on a single WebSocket object. Ensure that iteration and receive calls are managed by a single dedicated reader task or loop to prevent violating aiohttp's WebSocket state machine contracts.

```python
async def handler(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    task = asyncio.create_task(send_updates(ws))
    try:
        async for msg in ws:
            process_message(msg)
    finally:
        task.cancel()
    return ws
```


### Properly Handle Request and Response Errors in Client and Server Workflows

**Use when**

Building asynchronous clients, web applications, or WebSocket message loops using aiohttp where request failures, client disconnections, protocol errors, or response statuses must be handled safely.

**Secure rules**

**Rule 1: Configure automatic HTTP error response handling or explicitly catch client exceptions.**

Configure `raise_for_status=True` on `ClientSession` or explicitly catch exceptions inheriting from `aiohttp.ClientError` to prevent HTTP errors and network failures from causing unhandled application crashes.

```python
async with aiohttp.ClientSession(raise_for_status=True) as session:
    try:
        async with session.get('https://example.com/api') as response:
            data = await response.json()
    except aiohttp.ClientError as err:
        logger.error('HTTP request failed: %s', err)
```

**Rule 2: Raise HTTP exception instances instead of returning them in web request handlers.**

Use `raise` when triggering HTTP status exceptions like `web.HTTPBadRequest` in request handlers instead of returning them as response objects to ensure proper exception propagation and middleware processing.

```python
async def handler(request):
    if not request.query.get('id'):
        raise web.HTTPBadRequest(reason='Missing id parameter')
    return web.Response(text='OK')
```

**Rule 3: Catch parsing and decoding exceptions when processing request bodies and headers.**

Explicitly catch `json.JSONDecodeError`, `ValueError`, and `binascii.Error` when parsing incoming request bodies or headers to return controlled 400 or 401 error responses instead of leaking tracebacks.

```python
async def handle_json_data(request: web.Request) -> web.Response:
    try:
        data = await request.json()
        return web.json_response({'status': 'ok', 'data': data})
    except JSONDecodeError:
        return web.json_response({'error': 'Invalid JSON'}, status=400)
```
