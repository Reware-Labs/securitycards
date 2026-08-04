# Security cards

Repository: `https://github.com/pallets/flask#3.1.3`
Category: security control integrity

## security control integrity

### Explicitly Invoke Preprocess Request During Testing

**Use when**

Testing request-dependent code using `app.test_request_context()` where tests depend on security controls or identity population configured inside `before_request` hooks.

**Secure rules**

**Rule 1: Explicitly invoke preprocess request within test request contexts to ensure security hooks are executed.**

When testing request-dependent code using `app.test_request_context()`, Flask does not automatically execute request dispatching or `before_request` hooks. When tests depend on security controls, authentication checks, or identity population configured inside `before_request` hooks, developers must explicitly call `app.preprocess_request()` inside the request context or perform full client requests using `app.test_client()` to prevent bypassing security mechanisms.

```python
def test_auth_token(app):
    with app.test_request_context("/user/2/edit", headers={"X-Auth-Token": "1"}):
        app.preprocess_request()
        assert g.user.name == "Flask"
```
