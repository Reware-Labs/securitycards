# Security cards

Repository: `https://github.com/aio-libs/aiohttp#v3.14.3`
Category: input driven boundary selection

## input driven boundary selection

### Restrict and validate user-supplied destination URLs

**Use when**

Making asynchronous requests to target URLs provided by untrusted users using `session.get()`.

**Secure rules**

**Rule 1: Validate target URL schemes and handle client exceptions to prevent non-HTTP protocol usage.**

Catch `InvalidURL`, `NonHttpUrlClientError`, and `NonHttpUrlRedirectClientError` exceptions when processing user-supplied target URLs to enforce valid HTTP or HTTPS endpoints and prevent unexpected protocol handling.

```python
import aiohttp
from aiohttp.client_exceptions import InvalidURL, NonHttpUrlClientError

async def fetch_user_url(session: aiohttp.ClientSession, url: str):
    try:
        async with session.get(url) as response:
            return await response.text()
    except (InvalidURL, NonHttpUrlClientError) as err:
        raise ValueError(f"Invalid or non-HTTP URL: {url}") from err
```
