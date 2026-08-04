# Security cards

Repository: `https://github.com/labstack/echo#v5.3.1`
Category: network boundary

## network boundary

### Configure Explicit IPExtractor to Prevent Upstream IP Spoofing

**Use when**

Setting up proxy middleware or handling client IP addresses in Echo to prevent spoofing of X-Real-IP and X-Forwarded-For headers.

**Secure rules**

**Rule 1: Configure an explicit `e.IPExtractor` on the Echo instance before using proxy or remote IP functionality.**

To ensure upstream targets receive verified client IP addresses, developers must explicitly define `e.IPExtractor` on the Echo instance before attaching Proxy middleware.

```go
e := echo.New()
e.IPExtractor = echo.ExtractIPFromXFFHeader()

e.Use(middleware.Proxy(middleware.NewRoundRobinBalancer([]*middleware.ProxyTarget{
    { Name: "backend", URL: targetURL },
})))
```
