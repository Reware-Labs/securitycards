# Security cards

Repository: `https://github.com/go-chi/chi#v5.3.1`
Documentation repository: `https://github.com/go-chi/docs#master`
Category: boundary control

## boundary control

### Configure ClientIPFromHeader with unconditionally overwritten proxy headers

**Use when**

Setting up boundary trust verification and client IP retrieval using middleware.ClientIPFromHeader in chi applications behind a reverse proxy.

**Secure rules**

**Rule 1: Select only HTTP header names that your reverse proxy unconditionally overwrites on every request when using middleware.ClientIPFromHeader.**

When configuring `middleware.ClientIPFromHeader`, ensure you only supply header names such as `X-Real-IP` or `CF-Connecting-IP` that are unconditionally overwritten by your edge proxy. Avoid pass-through headers like `True-Client-IP`, `X-Azure-ClientIP`, or `Fastly-Client-IP` unless your edge proxy explicitly strips inbound client-supplied values to prevent IP spoofing at the network boundary.

```go
r := chi.NewRouter()
r.Use(middleware.ClientIPFromHeader("X-Real-IP"))
```
