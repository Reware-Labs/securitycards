# Security cards

Repository: `https://github.com/labstack/echo#v5.3.1`
Category: runtime environment hardening

## runtime environment hardening

### Disable detailed error exposure in production error handlers

**Use when**

Configuring Echo's HTTP error handling and runtime environment parameters for production deployments.

**Secure rules**

**Rule 1: Configure Echo's HTTP error handler to disable raw error exposure in production environments.**

Set `exposeError` to false when configuring the default HTTP error handler via `echo.DefaultHTTPErrorHandler(false)` using `echo.NewWithConfig`. This prevents sensitive implementation details, internal paths, and database errors from leaking to untrusted clients in production JSON responses.

```go
e := echo.NewWithConfig(echo.Config{
	HTTPErrorHandler: echo.DefaultHTTPErrorHandler(false),
})
```


### Prevent application crashes and process termination from runtime panics

**Use when**

Configuring the production runtime and middleware stack to protect the server process from unhandled panics and potential denial-of-service impacts.

**Secure rules**

**Rule 1: Register the Recover middleware to intercept runtime panics during request handling.**

Add `middleware.Recover()` near the top of the middleware stack so all route handlers and subsequent middleware are wrapped, preventing unhandled panics from crashing the web server process.

```go
e := echo.New()
e.Use(middleware.Recover())
```
