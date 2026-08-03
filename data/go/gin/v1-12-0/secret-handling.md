# Security cards

Repository: `https://github.com/gin-gonic/gin#v1.12.0`
Category: secret handling

## secret handling

### Redact Query Strings and Sensitive Headers in Application Logs

**Use when**

Configuring request logging and panic recovery middleware to prevent sensitive credentials, tokens, and query parameters from appearing in log outputs.

**Secure rules**

**Rule 1: Configure the Gin request logger to skip query string output and prevent sensitive parameters from exposure.**

Set `SkipQueryString: true` within `gin.LoggerConfig` when initializing the request logger so that URL query parameters containing credentials or tokens are omitted from log files.

```go
loggerConfig := gin.LoggerConfig{
    SkipQueryString: true,
}
router.Use(gin.LoggerWithConfig(loggerConfig))
```

**Rule 2: Sanitize or omit custom credentials and non-authorization headers in custom recovery handlers.**

Implement a custom recovery handler using `gin.CustomRecovery` to log generic error details without dumping unmasked sensitive headers, cookies, or request bodies that are not automatically masked by default recovery mechanisms.

```go
router := gin.New()
router.Use(gin.CustomRecovery(func(c *gin.Context, err any) {
    log.Printf("[Recovery] Panic caught on %s %s: %v", c.Request.Method, c.Request.URL.Path, err)
    c.AbortWithStatus(http.StatusInternalServerError)
}))
```
