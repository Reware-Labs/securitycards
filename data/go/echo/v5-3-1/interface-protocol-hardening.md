# Security cards

Repository: `https://github.com/labstack/echo#v5.3.1`
Category: interface protocol hardening

## interface protocol hardening

### Configure HTTP Response Security Headers Using Echo Middleware and Predefined Constants

**Use when**

Setting up response security headers like Content-Security-Policy, HSTS, X-Frame-Options, and X-Content-Type-Options in Echo handlers or middleware.

**Secure rules**

**Rule 1: Use Echo's `middleware.Secure()` or `middleware.SecureWithConfig()` to set essential HTTP security response headers.**

Configure `SecureConfig` options such as `XSSProtection`, `ContentTypeNosniff`, `XFrameOptions`, `HSTSMaxAge`, `ContentSecurityPolicy`, and `ReferrerPolicy` to protect applications against clickjacking, MIME-sniffing, transport downgrade attacks, and content injection.

```go
e := echo.New()

e.Use(middleware.SecureWithConfig(middleware.SecureConfig{
	XSSProtection:         "1; mode=block",
	ContentTypeNosniff:    "nosniff",
	XFrameOptions:         "SAMEORIGIN",
	HSTSMaxAge:            31536000,
	HSTSPreloadEnabled:    true,
	HSTSExcludeSubdomains: false,
	ContentSecurityPolicy: "default-src 'self'",
	ReferrerPolicy:        "strict-origin-when-cross-origin",
}))
```


### Restrict HTTP Method Overrides to Header-Based Configurations

**Use when**

When configuring method overriding behavior for HTTP requests in Echo applications to prevent unintended state-changing actions via forged parameters or query strings.

**Secure rules**

**Rule 1: Restrict HTTP method overrides to POST requests using the MethodOverride middleware with its default header-based configuration**

The MethodOverride middleware only permits an HTTP method to be overridden when the original request method is POST (for security reasons). Prefer the default configuration, which obtains the override value from the `X-HTTP-Method-Override` header via `MethodFromHeader`. Register the middleware with `Pre` so that the overridden method is visible to the router.

```go
e := echo.New()
e.Pre(middleware.MethodOverride())

// Alternatively, configure explicitly using the header-based getter:
e.Pre(middleware.MethodOverrideWithConfig(middleware.MethodOverrideConfig{
    Getter: middleware.MethodFromHeader(echo.HeaderXHTTPMethodOverride),
}))
```
