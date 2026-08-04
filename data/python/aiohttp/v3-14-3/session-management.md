# Security cards

Repository: `https://github.com/aio-libs/aiohttp#v3.14.3`
Category: session management

## session management

### Explicitly close active WebSockets upon user session termination

**Use when**

Handling user logout or revoking an active user session in an aiohttp server application.

**Secure rules**

**Rule 1: Close all active WebSocket connections belonging to a user when their session is terminated.**

Maintain a registry of active `web.WebSocketResponse` connections mapped to each user. When a user logs out or their session is revoked, iterate through their active WebSocket connections and explicitly invoke `ws.close()` to prevent continued data exchange over persistent connections.

```python
async def logout_handler(request):
    user_id = authenticate_user(request)
    ws_closers = [
        ws.close()
        for ws in request.app[websockets_key][user_id]
        if not ws.closed
    ]
    if ws_closers:
        await asyncio.gather(*ws_closers)
    return web.Response(text='OK')
```
