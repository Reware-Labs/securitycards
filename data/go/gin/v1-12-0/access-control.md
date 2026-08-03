# Security cards

Repository: `https://github.com/gin-gonic/gin#v1.12.0`
Category: access control

## access control

### Return Immediately After Aborting Request in Auth Middleware

**Use when**

When implementing authentication or authorization middleware in Gin to prevent unauthorized actions and enforce access control.

**Secure rules**

**Rule 1: Explicitly return after invoking abort methods in authorization middleware.**

Calling `c.Abort()`, `c.AbortWithStatus()`, or `c.AbortWithError()` prevents downstream handlers from executing, but it does not terminate the current handler function immediately. You must explicitly invoke `return` after calling abort methods to ensure that subsequent security checks or sensitive code inside that same middleware function do not continue to execute.

```go
func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        if !isAuthorized(c.Request) {
            c.AbortWithStatus(http.StatusUnauthorized)
            return // Stop execution of the current handler immediately
        }
        c.Next()
    }
}
```
