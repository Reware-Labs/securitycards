# Security cards

Repository: `https://github.com/beego/beego#v2.3.10`
Category: csrf

## csrf

### Implement Synchronizer Token Validation for State-Changing Requests

**Use when**

When developing state-changing web endpoints using Beego controllers and handlers that require Cross-Site Request Forgery protection.

**Secure rules**

**Rule 1: Enable XSRF protection globally or on controllers and validate incoming request tokens against the context token.**

Configure `EnableXSRF` on `WebConfig` or ensure `EnableXSRF` remains enabled on custom controllers handling state-changing methods. Call `XSRFToken` beforehand to generate and load the token into context, and invoke `CheckXSRFCookie()` during request processing to validate incoming tokens.

```go
web.BConfig.WebConfig.EnableXSRF = true
web.BConfig.WebConfig.XSRFKey = "_xsrf_token"
web.BConfig.WebConfig.XSRFExpire = 3600
```
