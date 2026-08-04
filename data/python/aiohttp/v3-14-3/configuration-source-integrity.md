# Security cards

Repository: `https://github.com/aio-libs/aiohttp#v3.14.3`
Category: configuration source integrity

## configuration source integrity

### Disable implicit proxy environment variable reading in ClientSession

**Use when**

Configuring aiohttp client sessions where environment variables and netrc files should not dictate proxy routing or authentication credentials.

**Secure rules**

**Rule 1: Leave trust_env set to False on ClientSession to prevent automatically reading proxy settings and authentication credentials from environment variables or ~/.netrc files.**

Explicitly set `trust_env=False` when initializing `aiohttp.ClientSession()` to ensure that security-sensitive network routing and configuration are not implicitly controlled by untrusted environment variables or local files.

```python
import aiohttp

async with aiohttp.ClientSession(trust_env=False) as session:
    async with session.get("https://example.com") as resp:
        text = await resp.text()
```
