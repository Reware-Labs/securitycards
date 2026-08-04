# Security cards

Repository: `https://github.com/aio-libs/aiohttp#v3.14.3`
Category: security control integrity

## security control integrity

### Preserve Session-Level Middlewares on Individual Request Overrides

**Use when**

When configuring and executing client requests with `aiohttp.ClientSession` where session-level middlewares handle critical security controls.

**Secure rules**

**Rule 1: Explicitly retain session-level security middlewares when passing per-request middlewares to avoid bypassing critical controls.**

When executing client requests with `aiohttp.ClientSession`, passing a `middlewares` tuple to individual request methods like `session.get()` completely replaces session-level middlewares instead of appending to them. Ensure that all essential session-level security middlewares are explicitly included in any per-request middleware tuples or initialize a separate session instance.

```python
async with ClientSession(middlewares=(auth_middleware,)) as session:
    async with session.get(url, middlewares=(auth_middleware, logging_middleware)) as resp:
        pass
```
