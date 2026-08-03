# Security cards

Repository: `https://github.com/labstack/echo#v5.3.1`
Category: secret handling

## secret handling

### Redact Secrets from Request Logs and Body Dumps

**Use when**

When configuring HTTP request loggers or body dump handlers in Echo to prevent sensitive data such as tokens, passwords, and private parameters from being written to logs.

**Secure rules**

**Rule 1: Sanitize and redact sensitive body payloads before logging or persisting them.**

Implement data redaction routines inside the `BodyDumpHandler` callback to sanitize captured request and response byte slices before logging or transmitting them.

```go
e.Use(middleware.BodyDump(func(c *echo.Context, reqBody []byte, resBody []byte, err error) {
	sanitizedReq := redactSensitiveData(reqBody)
	sanitizedRes := redactSensitiveData(resBody)
	slog.Info("http dump", "path", c.Path(), "req", sanitizedReq, "res", sanitizedRes)
}))
```
