# Security cards

Repository: `https://github.com/urllib3/urllib3#2.7.0`
Category: secret handling

## secret handling

### Strip Custom Sensitive Headers on Cross-Host Redirects

**Use when**

Configuring connection retry behaviors and making HTTP requests where custom API keys or authentication tokens may be exposed during cross-host redirects.

**Secure rules**

**Rule 1: Include urllib3’s standard sensitive headers and all custom secret headers in `remove_headers_on_redirect`**

Passing a custom `remove_headers_on_redirect` collection replaces the default collection. When adding custom secret headers, also include `Authorization`, `Cookie`, and `Proxy-Authorization` so these standard sensitive headers continue to be removed when a redirect crosses host boundaries.

```python
from urllib3 import PoolManager
from urllib3.util import Retry

custom_retry = Retry(
    remove_headers_on_redirect=[
        "Authorization",
        "Cookie",
        "Proxy-Authorization",
        "X-API-Secret",
    ]
)

with PoolManager() as http:
    response = http.request(
        "GET",
        "https://example.com/redirect-target",
        headers={
            "X-API-Secret": "my-secret-key",
            "Authorization": "Bearer token123",
        },
        retries=custom_retry,
    )
```
