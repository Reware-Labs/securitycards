# Security cards

Repository: `https://github.com/encode/httpx#0.28.1`
Category: security control integrity

## security control integrity

### Enforce Automated HTTP Status Validation Using Response Hooks

**Use when**

When registering response event hooks on an HTTPX client to consistently enforce status code checking across all operations.

**Secure rules**

**Rule 1: Register a response event hook that calls response.raise_for_status() to automatically enforce status code checks globally.**

Use event hooks to guarantee that every client response triggers an `httpx.HTTPStatusError` on HTTP 4xx or 5xx responses, preventing application logic flaws or security control bypasses from unhandled error responses.

```python
import httpx

def check_status(response: httpx.Response) -> None:
    response.raise_for_status()

client = httpx.Client(event_hooks={"response": [check_status]})

try:
    response = client.get("https://api.example.com/data")
except httpx.HTTPStatusError as exc:
    # Handle HTTP error response
    pass
```
