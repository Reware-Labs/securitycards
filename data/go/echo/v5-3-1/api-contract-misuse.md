# Security cards

Repository: `https://github.com/labstack/echo#v5.3.1`
Category: api contract misuse

## api contract misuse

### Configure Valid Redirect Status Codes for Protocol Compliance and URI Sanitization

**Use when**

Configuring redirect middleware or trailing slash handling where explicit HTTP redirect status codes must be provided to ensure protocol compliance and prevent open redirect vulnerabilities.

**Secure rules**

**Rule 1: Supply a valid HTTP status code within the 300-308 range when configuring redirect options or trailing slash middleware.**

When defining redirect configurations with `RedirectConfig` or trailing slash middleware, ensure the configured redirect code falls within the valid `300-308` range such as `http.StatusMovedPermanently` or `http.StatusPermanentRedirect`. Echo validates this range during middleware creation to ensure protocol compliance and properly sanitizes redirect URIs.

```go
e := echo.New()
e.Pre(middleware.AddTrailingSlashWithConfig(middleware.AddTrailingSlashConfig{
    RedirectCode: http.StatusMovedPermanently,
}))
```


### Properly Handle and Wrap Errors in Echo Middleware and Handlers

**Use when**

Use when writing custom error handlers, proxy middleware, or integrating authentication and rate-limiting middleware in Echo applications to prevent information disclosure, response commitment conflicts, and security control bypasses.

**Secure rules**

**Rule 1: Wrap low-level or internal errors using echo HTTP error methods to preserve error status codes and internal details securely.**

When returning HTTP errors in Echo handlers or custom middleware, construct errors using `echo.NewHTTPError(code, message)` or wrap underlying errors with `.Wrap(err)` or `fmt.Errorf` so that `echo.StatusCode(err)` correctly resolves status codes while keeping client-facing error messages sanitized.

```go
func HandleRequest(c *echo.Context) error {
	if err := performOperation(); err != nil {
		return echo.ErrInternalServerError.Wrap(err)
	}
	return c.NoContent(http.StatusOK)
}
```

**Rule 2: Verify response commitment status before writing error responses in centralized error handlers.**

Before attempting to write error status codes or payload frames in centralized error handlers or request loggers, check `c.Response().Committed` or `echo.UnwrapResponse(c.Response())` to ensure response headers have not already been sent to the client.

```go
e.HTTPErrorHandler = func(c *echo.Context, err error) {
	if r, _ := echo.UnwrapResponse(c.Response()); r != nil && r.Committed {
		return
	}
	_ = c.String(http.StatusInternalServerError, "Internal Error")
}
```

**Rule 3: Return allowed=false with a nil error when rejecting origins in UnsafeAllowOriginFunc**

When implementing `UnsafeAllowOriginFunc` inside `CORSConfig`, a non-nil error is returned immediately by the handler. To reject an unauthorized origin, return `allowed=false` with a nil error (as shown in the official example).

```go
config := middleware.CORSConfig{
    UnsafeAllowOriginFunc: func(c *echo.Context, origin string) (string, bool, error) {
        if strings.HasSuffix(origin, ".example.com") {
            return origin, true, nil
        }
        return "", false, nil
    },
}
```

**Rule 4: Prevent authentication and rate-limiting security bypasses when handling ignored or extraction errors.**

When configuring optional authentication or rate-limiting error handlers, ensure errors do not silently fail open or swallow critical security failures unless explicit fallback context state is assigned.

```go
middleware.KeyAuthConfig{
	Validator: validateKey,
	ErrorHandler: func(c *echo.Context, err error) error {
		c.Set("auth_role", "anonymous")
		return nil
	},
	ContinueOnIgnoredError: true,
}
```
