# Security cards

Repository: `https://github.com/encode/httpx#0.28.1`
Category: session management

## session management

### Isolate Client Instances and Configure Cookies at Initialization

**Use when**

Managing session state and cookie persistence across requests when using `httpx.Client`.

**Secure rules**

**Rule 1: Configure persistent session cookies during client instantiation to prevent cross-session leakage.**

Supply persistent cookies upon client creation rather than passing per-request cookies or reusing a single client across multiple user sessions. Reusing a single client instance causes session cookies set by one server response to persist and automatically attach to subsequent requests, potentially leaking sensitive session tokens across distinct user contexts.

```python
import httpx

# Configure cookies at client initialization per session
def fetch_user_data(user_cookies: dict) -> httpx.Response:
    with httpx.Client(cookies=user_cookies) as client:
        return client.get("https://example.org/echo_cookies")
```
