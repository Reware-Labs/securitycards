# Security cards

Repository: `https://github.com/encode/httpx#0.28.1`
Category: api contract misuse

## api contract misuse

### Declare Body Requirements in Custom Authentication Flows

**Use when**

Developing custom authentication flows by subclassing `httpx.Auth` that inspect request or response content.

**Secure rules**

**Rule 1: Explicitly set body requirement flags on custom authentication classes before accessing request or response payloads.**

When creating a custom authentication subclass of `httpx.Auth`, you must explicitly set `requires_request_body = True` or `requires_response_body = True` on the class if your authentication flow inspects `request.content` or `response.content`. Failing to declare these requirements will cause request execution failures or stream-handling bugs.

```python
class SignedAuth(httpx.Auth):
    requires_request_body = True

    def __init__(self, token):
        self.token = token

    def auth_flow(self, request):
        signature = self.sign(request.content)
        request.headers["X-Signature"] = signature
        yield request

    def sign(self, body):
        return "signature_value"
```
