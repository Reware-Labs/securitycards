# Security cards

Repository: `https://github.com/Kludex/starlette#1.3.1`
Category: interface protocol hardening

## interface protocol hardening

### Configure CORSMiddleware security headers safely for credentialed and private network requests

**Use when**

Configuring Starlette CORSMiddleware security headers to restrict cross-origin access, handle credentials securely, and control private network access.

**Secure rules**

**Rule 1: Restrict allowed origins and disable private network access when using CORSMiddleware unless external interaction with internal networks is explicitly required.**

Combine restrictive `allow_origins` or strict regular expressions with `allow_credentials=True` to rely on automatic `Vary` header management, and ensure `allow_private_network` is set to `False` to prevent unauthorized public-to-private cross-origin requests.

```python
Middleware(
    CORSMiddleware,
    allow_origins=["https://app.example.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
    allow_private_network=False
)
```
