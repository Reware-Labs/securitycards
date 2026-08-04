# Security cards

Repository: `https://github.com/encode/httpx#0.28.1`
Category: secret handling

## secret handling

### Prevent sensitive credential leaks across requests and redirects

**Use when**

When developers configure client instances with default headers or custom authentication properties, or manage redirection behaviors.

**Secure rules**

**Rule 1: Strip sensitive client default headers before dispatching third-party requests**

Client-level default headers are automatically included on all outgoing requests sent through that client instance, which can accidentally leak secret tokens or API keys to unintended hosts. Use `client.build_request()` and explicitly remove sensitive credentials before dispatching requests to public or third-party URLs.

```python
import httpx

headers = {"X-Api-Key": "secret-api-token", "X-Client-ID": "ABC123"}

with httpx.Client(headers=headers) as client:
    request = client.build_request("GET", "https://public-api.example.com")
    del request.headers["X-Api-Key"]
    response = client.send(request)
```

**Rule 2: Prevent sensitive header leaks during cross-origin redirects**

While HTTPX automatically strips standard `Authorization` headers on cross-origin redirects, custom API key headers are not automatically purged. When `follow_redirects` is enabled, ensure custom sensitive headers are not forwarded to untrusted third-party redirect locations, or manage redirects explicitly.

```python
import httpx

with httpx.Client(follow_redirects=False) as client:
    response = client.get(
        "https://api.example.com/data",
        headers={"X-Api-Key": "secret-token-123"}
    )
    if response.is_redirect:
        target_url = response.headers["location"]
        if target_url.startswith("https://api.example.com/"):
            response = client.get(target_url, headers={"X-Api-Key": "secret-token-123"})
```


### Redact and sanitize sensitive credentials in logs and telemetry outputs

**Use when**

When developers are logging HTTP request objects, response headers, URLs, or implementing request event hooks and diagnostics.

**Secure rules**

**Rule 1: Rely on built-in credential obfuscation for URL representations**

When logging `httpx.URL` instances containing embedded basic authentication credentials, use `repr()` or string formatting specifiers like `%r` to automatically mask passwords as `[secure]` instead of converting the URL to a string.

```python
import httpx

url = httpx.URL("https://user:secret_pass@example.com/api")
logger.info("Connecting to %r", url)
```

**Rule 2: Sanitize custom credentials in request headers before logging**

Because HTTPX automatically obfuscates standard authorization headers but does not mask custom sensitive headers like API keys or cookies, developers must explicitly filter or redact custom credential keys before recording header dictionaries in application logs or event hooks.

```python
def log_request(request: httpx.Request) -> None:
    headers = dict(request.headers)
    if "authorization" in headers:
        headers["authorization"] = "[REDACTED]"
    logger.info("Outgoing request to %s with headers %s", request.url, headers)

client = httpx.Client(event_hooks={"request": [log_request]})
```
