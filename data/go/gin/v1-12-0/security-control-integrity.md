# Security cards

Repository: `https://github.com/gin-gonic/gin#v1.12.0`
Category: security control integrity

## security control integrity

### Preserve Error Status Codes with Custom Recovery Handlers

**Use when**

When configuring panic recovery middleware in Gin applications to ensure clean error handling and prevent uncontrolled status code overwrites.

**Secure rules**

**Rule 1: Use custom recovery handlers to gracefully catch panics and control error status codes.**

Implement `CustomRecovery` or `CustomRecoveryWithWriter` to define clean error handling logic when panics occur in HTTP handlers. If a handler explicitly calls `c.AbortWithStatus(...)` before a panic or within the custom recovery handler, Gin preserves the aborted HTTP status code rather than overwriting it with an uncontrolled response.

```go
router := gin.New()
handleRecovery := func(c *gin.Context, err any) {
    c.AbortWithStatus(http.StatusInternalServerError)
}
router.Use(gin.CustomRecovery(handleRecovery))
```
