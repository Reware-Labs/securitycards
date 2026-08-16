# Security cards

Repository: `https://github.com/django/django#6.0.7`
Category: boundary control

## boundary control

### Configure SECURE_PROXY_SSL_HEADER safely behind a trusted proxy

**Use when**

Deploying Django behind a reverse proxy to handle secure connection transitions at the server boundary.

**Secure rules**

**Rule 1: Only enable SECURE_PROXY_SSL_HEADER when running behind a trusted reverse proxy that strips incoming header values from untrusted clients.**

Set `SECURE_PROXY_SSL_HEADER` only if your reverse proxy strictly sanitizes and strips any user-supplied header matching the configured proxy SSL header. Failing to do so allows untrusted clients to spoof secure connections at the application boundary.

```python
# Only use behind a trusted reverse proxy that sanitizes request headers
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
```
