# Security cards

Repository: `https://github.com/gin-gonic/gin#v1.12.0`
Category: interface protocol hardening

## interface protocol hardening

### Sanitize Forwarded Prefix Headers at Reverse Proxy Boundaries

**Use when**

Configuring reverse proxy boundaries and managing incoming request forwarding headers in Gin applications.

**Secure rules**

**Rule 1: Ensure reverse proxies explicitly set or strip untrusted `X-Forwarded-Prefix` headers to prevent HTTP redirect manipulation.**

When `RedirectTrailingSlash` is enabled, Gin inspects incoming `X-Forwarded-Prefix` HTTP headers to construct location headers for redirects. Configure your reverse proxy to override or strip untrusted client headers to prevent malicious injection.

```go
router := gin.New()
router.RedirectTrailingSlash = true
```
