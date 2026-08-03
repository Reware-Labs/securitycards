# Security cards

Repository: `https://github.com/urllib3/urllib3#2.7.0`
Category: interface protocol hardening

## interface protocol hardening

### Validate HTTP Request Methods and Reject Invalid Verbs

**Use when**

Making HTTP requests and defining custom method names using urllib3

**Secure rules**

**Rule 1: Use urllib3’s request API to reject malformed HTTP methods**

Send HTTP requests through `PoolManager.request()`. It normalizes the method to uppercase, and urllib3’s HTTP/1.1 connection rejects methods containing non-token characters with `ValueError`. Do not use `Retry.allowed_methods` for validation; that option only controls which methods may be retried.

```python
import urllib3

http = urllib3.PoolManager()

try:
    http.request("GET\n", "https://httpbin.org/")
except ValueError as error:
    print(f"Invalid HTTP method rejected: {error}")
```
